# 05 — The reflection mapper

*Figure: `figures/05-card-catalog/index.html` — a card catalog: the query card (the request)
is matched against the index (attributes), the drawer opens, arguments drop into their slots,
and the mechanism types the answer.*

## One engine, three front doors

`Modules/Reflection` is shared by three frameworks:

- `ServiceResource.From<T>()` — RPC-style resources, `[ResourceMethod(Method.Get, "users/:id")]`
- `Controller.From<T>()` — MVC-ish, every public/internal method becomes an operation
- `Inline.Create().Get("/add", (int a, int b) => a + b)` — minimal-API style lambdas

All three end in the same machinery: `MethodCollection` → `OperationRouter` → `MethodHandler`.

## From method to operation

`TypeAnalyzer.FindMethods` picks up `public` *and* `internal` methods (commit 6598186d made
internal/private work with all execution modes). `OperationBuilder.Create` parses the route
into segments — `:var` → `SimpleVariableSegment`, `(?<name>regex)` → `RegexSegment`, literals
→ `StringSegment`, plus a wildcard `ClosingSegment` when a method returns `IHandler`/
`IHandlerBuilder` (handlers can return sub-handlers). `SignatureAnalyzer.GetArguments` binds
each parameter by fixed precedence:

**path → injected → streamed → body → query → content**

- *path*: a route segment name (`:id`), converted by the formatter registry
- *injected*: an `IParameterInjector` that `Supports` the type — built-ins: `RequestInjector`,
  `HandlerInjector`, `BodyArgumentsInjector`, `UserInjector<T>` (reads the auth user),
  `DependencyInjector` (any registered service)
- *streamed*: a `Stream` parameter gets the raw body
- *body*: `[FromBody]` on a formattable type
- *query*: formattable types from the query string
- *content*: complex types deserialized by the registered `ISerializationFormat`
  (JSON by default; YAML, form-url-encoded, XML, Protobuf addable)

## Execution modes: compiled when possible

`ExecutionMode.Auto` compiles the invocation with Roslyn
(`Generation/OptimizedDelegate.cs` → `CodeProvider.Generate` emits a real
`Invoke(instance, operation, request, handler, registry, match, interception)` method).
Without Roslyn or on ARM it falls back to `RunViaReflection` — *per operation*, and internal
methods are forced to reflection deliberately.

## Interceptors

```csharp
public interface IOperationInterceptor
{
    void Configure(object attribute);
    ValueTask<InterceptionResult?> InterceptAsync(IRequest request, Operation operation,
        IReadOnlyDictionary<ByteString, object?> arguments);
}
```

`[InterceptWith<T>]` on a method (or `IDocumentedInterceptor`, which also contributes
OpenAPI documentation). The shipped example: `[RequireRole("admin")]` is an
`InterceptWithAttribute<RoleInterceptor>` that throws 401/403 *and documents those responses*.
A non-null `InterceptionResult` short-circuits the method.

Results are uniform: `Result<T>` wrappers get `.Status()/.Header()/.Cookie()/.Connection()`,
and `ResponseProvider` dispatches on `OperationResultSink` (dynamic / binary / formatter /
serializer / none).

## Why this is god tier

The binding rules are a fixed, documented precedence instead of magic; the fast path is a
Roslyn-compiled delegate rather than `MethodInfo.Invoke` per request; interceptors and
serialization are the *same* objects that feed OpenAPI (topic 06); and the whole thing works
identically for classes, controllers and lambdas. It is a mini-MediatR-plus-MVC in ~15
source files, with no code-gen step imposed on the user.
