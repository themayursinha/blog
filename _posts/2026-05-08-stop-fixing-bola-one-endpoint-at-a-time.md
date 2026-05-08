---
layout: post
title: "Stop Fixing BOLA One Endpoint at a Time: How to Eliminate an Entire Class of API Authorization Bugs"
date: 2026-05-08
categories: [security]
tags: [security, appsec, api-security, authorization, bola]
description: "BOLA is not solved by asking every developer to remember object-level checks. It is solved by making authorization a reusable platform capability."
share-img: /img/circuit.png
related_posts:
  - Reframing Application Security
  - Traditional manual code review is no longer sustainable
  - Game theory for cybersecurity: from reactive defense to strategic resilience
---

Most API security conversations about Broken Object Level Authorization start with a small request.

```http
GET /orders/12345
Authorization: Bearer token-for-user-a
```

Then the attacker changes the object ID.

```http
GET /orders/67890
Authorization: Bearer token-for-user-a
```

If the API returns another user's order, we call it Broken Object Level Authorization, or BOLA. In older application security language, many teams still call this IDOR.

The standard fix is usually framed as a developer reminder:

```text
Check authorization before returning the object.
```

That advice is correct. It is also too small.

If the security of the system depends on every developer remembering to add the right authorization check in every controller, every GraphQL resolver, every background job, every internal API, and every new service, the organization will keep finding the same bug in different places.

The better question is not:

```text
How do we fix this BOLA finding?
```

The better question is:

```text
How do we make this bug class difficult to introduce in the first place?
```

That is the difference between fixing vulnerabilities and building secure systems.

## BOLA is not an authentication problem

Authentication answers:

```text
Who is this user?
```

Authorization answers:

```text
What is this user allowed to do?
```

Object-level authorization asks a more specific question:

```text
Is this user allowed to perform this action on this exact object?
```

That distinction matters.

A valid access token can prove that the requester is `user_a`. It can even prove that `user_a` has a scope like `orders:read`. But it does not automatically prove that `user_a` can read `order_67890`.

For that, the application has to compare the subject with the resource.

```text
subject.user_id == order.owner_id
```

or in a multi-tenant system:

```text
subject.tenant_id == order.tenant_id
```

or for a privileged access path:

```text
subject.tenant_id == order.tenant_id
AND subject.role == "merchant_admin"
AND subject.scopes contains "orders:read"
```

This is why BOLA survives in mature systems. The authentication layer can be strong while object-level authorization remains inconsistent.

OWASP ranks [Broken Object Level Authorization as API1:2023](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/). The guidance is direct: attackers exploit APIs by manipulating object IDs in paths, query strings, headers, and request bodies. Every endpoint that receives an object ID and performs an action on that object should validate whether the logged-in user is allowed to perform that action.

That is a simple rule. The hard part is making it real across a growing system.

## The root cause is architectural

In many microservice architectures, authorization logic is scattered across services.

One team writes:

```typescript
if (order.userId !== currentUser.id) {
  throw new ForbiddenError();
}
```

Another team writes:

```typescript
if (!user.roles.includes("admin")) {
  throw new ForbiddenError();
}
```

Another team checks tenant but not ownership.

Another team relies on the frontend hiding buttons.

Another team assumes UUIDs are unguessable enough.

Another team forgets the check completely.

Over time, every service develops its own private interpretation of authorization:

- Some check ownership.
- Some check tenant.
- Some check only role.
- Some check only OAuth scopes.
- Some trust upstream services.
- Some rely on route naming conventions.
- Some assume "internal" APIs do not need user-context authorization.

This is how a bug class survives.

The problem is not only a missing `if` statement. The problem is the absence of a standard authorization model.

That is why I think about BOLA less as a single bug and more as an architecture smell. The finding tells you something about how the system was built. It says object access is happening without a consistent policy path.

## Authorization should be a platform capability

To eliminate BOLA as a recurring class of bugs, authorization has to become a reusable platform capability.

The goal is simple:

```text
Every sensitive object access should go through a standard authorization path.
```

That path should answer:

```text
Can this subject perform this action on this resource in this tenant and context?
```

A good authorization decision has four parts.

```json
{
  "subject": {
    "user_id": "user_123",
    "tenant_id": "tenant_abc",
    "roles": ["merchant_admin"],
    "scopes": ["orders:read"]
  },
  "action": "orders:read",
  "resource": {
    "type": "order",
    "id": "order_789",
    "tenant_id": "tenant_abc",
    "owner_id": "user_123"
  },
  "context": {
    "source_service": "checkout-api",
    "request_id": "req_456",
    "access_path": "customer_portal"
  }
}
```

The policy can then be expressed clearly.

```text
ALLOW orders:read if:
  subject.tenant_id == resource.tenant_id
  AND subject.scopes contains "orders:read"
  AND (
    subject.user_id == resource.owner_id
    OR subject.roles contains "merchant_admin"
  )
```

That is the core pattern.

You can implement it with a policy engine, a shared authorization library, a service mesh extension, a local SDK, a centralized policy decision point, or a combination of those. The specific technology matters less than the invariant:

```text
Object access must have a standard policy path.
```

## The reference architecture

A practical architecture looks like this:

```text
Client
  |
  v
Identity Provider
  - login
  - MFA
  - token issuance
  - user and organization claims
  |
  v
API Gateway or Edge
  - token validation
  - coarse scope checks
  - schema validation
  - rate limiting
  |
  v
Service AuthZ Middleware
  - extract subject
  - extract action
  - extract resource type and ID
  - load minimal resource metadata
  - evaluate object-level policy
  - emit authorization logs
  |
  v
Business Logic
  |
  v
Tenant-scoped Data Access
```

Each layer has a job.

The identity provider proves who the user is.

The gateway validates tokens and enforces coarse controls.

The service-level authorization layer enforces object-level decisions.

The data access layer adds defense in depth with tenant and ownership constraints.

WAAP, API security, SIEM, and runtime detection systems provide telemetry, anomaly detection, and compensating controls.

No single layer solves everything.

This aligns with OWASP's [Microservices Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Microservices_Security_Cheat_Sheet.html), which treats authentication and authorization as design-phase requirements for microservice systems. It also separates edge-level authorization from service-level authorization, which is exactly the distinction that matters for BOLA.

## Where identity providers fit

Auth0, Okta, Entra ID, Cognito, or any similar identity provider belongs at the identity layer.

An identity provider can handle:

- authentication
- SSO
- MFA
- OAuth2 and OIDC flows
- token issuance
- user identity claims
- organization, role, permission, or scope claims

A token may include claims like this:

```json
{
  "sub": "user_123",
  "aud": "https://api.example.com",
  "iss": "https://idp.example.com/",
  "permissions": ["orders:read", "orders:write"],
  "https://example.com/tenant_id": "tenant_abc",
  "https://example.com/roles": ["merchant_admin"]
}
```

That is useful. It is not enough to prevent BOLA.

The token can tell the API:

```text
This is user_123.
This token is valid.
The user has orders:read.
The user belongs to tenant_abc.
```

The application still has to answer:

```text
Does order_789 belong to tenant_abc?
Is user_123 the owner?
Is user_123 allowed to read this order through this access path?
Does the resource state allow this action?
```

A useful mental model is:

```text
Identity provider -> trusted subject context
Service -> trusted resource context
Authorization layer -> decision
```

BOLA happens when the first part exists but the second and third parts are incomplete.

## Why API gateway authorization is not enough

API gateways are useful. They can validate tokens, enforce scopes, rate-limit traffic, reject malformed requests, and block obviously abusive patterns.

But gateways usually do not know enough about the object being accessed.

Consider:

```http
GET /orders/order_789
Authorization: Bearer token-for-user-a
```

The gateway can check whether the token is valid. It can check whether the token has `orders:read`. It may even check whether the route is allowed.

But it usually cannot know whether `order_789` belongs to the requester's tenant, whether the requester owns it, whether the request is a support workflow, or whether the order is in a state that allows the action.

That information lives inside the order service and its data store.

So the gateway can enforce coarse authorization. The service must enforce object authorization.

This is also why "we use an API gateway" is not a satisfying answer to a BOLA finding. The question is not whether the request reached an authenticated route. The question is whether the subject was authorized for that specific object.

## Why WAAP is useful but not the source of truth

WAAP and API security platforms can add real value.

They help with:

- API discovery
- shadow API detection
- schema validation
- bot and abuse protection
- rate limiting
- injection and protocol attack blocking
- enumeration detection
- runtime anomaly detection
- virtual patching
- API security telemetry

For BOLA, a WAAP may detect suspicious behavior such as a user trying many object IDs in sequence.

```text
GET /orders/1001
GET /orders/1002
GET /orders/1003
GET /orders/1004
```

That signal is useful.

But BOLA does not always look noisy. An attacker may make one request to one object ID they already know. If the application returns the object, the root cause is still broken authorization logic.

A WAAP usually does not know the full relationship between:

```text
user -> tenant -> role -> resource -> business state -> action
```

So the right position is:

```text
WAAP is a valuable compensating and detective layer.
It is not the authoritative fix for object-level authorization.
```

The authoritative fix belongs in the application or service authorization layer.

## The service-level AuthZ middleware pattern

The most practical pattern is shared middleware or an SDK used across services.

For example:

```typescript
@authorize({
  action: "orders:read",
  resourceType: "order",
  resourceIdParam: "orderId"
})
@Get("/orders/:orderId")
async getOrder(req, res) {
  return orderService.getOrder(req.params.orderId);
}
```

The developer declares the intended action and resource. The middleware handles the rest:

1. Extract the authenticated subject.
2. Extract the resource ID.
3. Load minimal resource metadata.
4. Check tenant boundary.
5. Evaluate policy.
6. Log the decision.
7. Deny by default if the decision is unclear.

This pattern reduces cognitive load. Developers do not need to rediscover the authorization model every time they add an endpoint. They use a paved road.

The middleware should also make insecure paths visible. For example, a new route that accepts `:orderId` but has no authorization annotation should create a CI warning or failure. A controller that loads an object before authorization should be easy to detect. A service method that accepts object IDs without a subject context should look suspicious in code review.

This is where authorization becomes developer experience, not just policy.

## Defense in depth at the data layer

Middleware is important, but the database query should also enforce tenant or ownership boundaries.

Bad:

```sql
SELECT * FROM orders WHERE id = :order_id;
```

Better:

```sql
SELECT * FROM orders
WHERE id = :order_id
AND tenant_id = :subject_tenant_id;
```

For user-owned resources:

```sql
SELECT * FROM orders
WHERE id = :order_id
AND tenant_id = :subject_tenant_id
AND owner_id = :subject_user_id;
```

This gives defense in depth. If someone bypasses middleware or makes a mistake in business logic, the data access layer still reduces blast radius.

For high-risk multi-tenant systems, this should become a standard repository pattern:

```typescript
orderRepository.getByIdForSubject(orderId, subject)
```

not:

```typescript
orderRepository.getById(orderId)
```

The method signature itself should make the secure path easier than the insecure path.

## Service-to-service authorization

Microservices make BOLA more interesting because requests often move through several services.

A downstream service should know two things:

```text
Who initiated the request?
Which service is calling me?
```

That means preserving both actor and caller context.

```json
{
  "actor": {
    "user_id": "user_123",
    "tenant_id": "tenant_abc",
    "roles": ["buyer"]
  },
  "caller": {
    "service": "checkout-service"
  }
}
```

The receiving service should verify:

1. Is this service allowed to call this endpoint?
2. Is the original user allowed to access this object?

Without actor propagation, internal services become confused deputies. A service may use its own broad privileges to access data the original user should not see.

OWASP's microservices guidance recommends propagating a trusted internal representation of the external entity identity between services, rather than passing untrusted external tokens around casually. That design instinct matters for BOLA because the downstream service needs user context, not just service identity.

The secure default is not:

```text
Internal traffic is trusted.
```

The secure default is:

```text
Internal callers are authenticated, authorized, and still constrained by the initiating actor.
```

## Test the bug class, not only the endpoint

A mature program does not rely only on manual testing or point-in-time pentests.

Create reusable BOLA test fixtures.

```text
User A in Tenant A owns Object A
User B in Tenant B owns Object B
Admin A belongs to Tenant A
Admin B belongs to Tenant B
```

Then test the invariant across resource types.

```text
User A can access Object A: expect 200
User A cannot access Object B: expect 403 or 404
User B cannot access Object A: expect 403 or 404
Tenant admin A can access only Tenant A objects
Tenant admin A cannot access Tenant B objects
Support access requires explicit policy and audit trail
```

Run this pattern across sensitive resources:

- orders
- carts
- customers
- payments
- promotions
- inventory
- admin settings
- exports
- invoices
- support workflows

This is how you turn BOLA from an ad hoc finding into a regression-tested control.

OWASP's BOLA prevention guidance explicitly recommends writing tests for the authorization mechanism and not deploying changes that break those tests. The important move is to make those tests reusable enough that every team does not have to invent them from scratch.

## CI/CD guardrails

To prevent the bug class from reappearing, add CI checks.

A pull request should warn or fail when:

- a new API route has no authorization annotation
- a controller reads an object by ID without AuthZ middleware
- a database query uses object ID without tenant or owner constraint
- a sensitive DTO exposes fields without explicit response shaping
- an admin endpoint lacks elevated policy
- a service-to-service endpoint fails to validate caller identity

The goal is not to make CI noisy. The goal is to catch structural authorization gaps before they reach production.

Start with warnings if the signal is immature. Move to enforcement when the patterns are stable. Security controls that begin as observability often become stronger because teams learn what "good" looks like before blocking deploys.

## Observability and runtime detection

Every important authorization decision should produce structured logs.

```json
{
  "subject_id": "user_123",
  "tenant_id": "tenant_a",
  "action": "orders:read",
  "resource_type": "order",
  "resource_id": "order_789",
  "decision": "deny",
  "reason": "tenant_mismatch",
  "service": "order-service",
  "request_id": "req_456"
}
```

Useful detections include:

- many denied object accesses from the same user
- sequential object ID access
- cross-tenant access attempts
- sudden spikes in 403 responses
- admins accessing unusual customer objects
- services calling APIs outside expected patterns
- break-glass access without a ticket or approval record

This is where WAAP, application logs, SIEM, and service telemetry should work together.

Application authorization logs explain the decision. WAAP and API security tools provide request pattern visibility. SIEM correlation can connect those events to account risk, device risk, service behavior, and incident response workflows.

Detection does not replace prevention. It tells you when prevention is being tested.

## Do not stop at BOLA

BOLA is about access to an object.

Broken Object Property Level Authorization, or BOPLA, is about access to fields inside the object.

OWASP separates [Broken Object Property Level Authorization as API3:2023](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/). This category combines the older themes of excessive data exposure and mass assignment around one root cause: missing or improper authorization at the object property level.

A user may be allowed to read a user object without being allowed to see every field on it.

```json
{
  "id": "user_123",
  "name": "Alice",
  "email": "alice@example.com",
  "internalRiskScore": "high",
  "adminNotes": "manual review required"
}
```

The same applies to writes. Mass assignment happens when a client can send fields they should not control.

```json
{
  "name": "Alice",
  "role": "admin",
  "discountRate": 90
}
```

Prevent this with:

- explicit response DTOs
- field-level authorization
- input allowlists
- separate public and internal models
- schema validation
- no blind binding from request bodies to domain models

Solving BOLA without thinking about BOPLA is incomplete. Object-level access answers whether the user can touch the object. Property-level access answers which parts of that object they can see or change.

## A practical rollout plan

The right rollout is incremental. Start small, but design for scale.

### Phase 1: Inventory

Identify APIs that accept object IDs and expose sensitive resources. Include REST paths, GraphQL resolvers, async jobs, admin APIs, internal service APIs, exports, and support tooling.

### Phase 2: Classify resources

Define resource types such as order, cart, customer, payment, promotion, inventory, tenant, user, invoice, export, and admin setting.

### Phase 3: Define actions

Standardize actions such as read, create, update, delete, approve, refund, export, impersonate, and manage.

### Phase 4: Create policy templates

Start with common patterns:

- owner access
- tenant admin access
- internal service access
- support access
- break-glass access
- read-only analytics access

### Phase 5: Build the middleware

Provide decorators, helper functions, metadata loaders, policy clients, route annotations, and audit logging.

### Phase 6: Start with high-risk APIs

Prioritize customer data, orders, carts, payments, admin APIs, exports, and tenant configuration.

### Phase 7: Monitor first, enforce next

Run in monitor mode to find false positives. Move to enforcement once policies are stable and teams trust the control.

### Phase 8: Add tests and CI checks

Prevent regressions through automated BOLA tests, route-level checks, and data-access guardrails.

### Phase 9: Add runtime detection

Feed authorization decisions into SIEM and WAAP telemetry. Build detections around enumeration, cross-tenant attempts, unusual admin access, and confused-deputy patterns.

### Phase 10: Measure adoption

Track:

- percentage of sensitive endpoints using standard AuthZ
- percentage of APIs covered by BOLA test fixtures
- authorization bypass findings over time
- critical AuthZ findings from pentests and bug bounty
- false positive rate of enforcement
- mean time to remediate authorization issues

Security work gets funded when it can show risk reduction. A platform approach gives you something measurable.

## The leadership lesson

Many security programs get stuck in vulnerability-by-vulnerability mode.

A pentest finds BOLA in one endpoint. The team fixes that endpoint.

A bug bounty report finds another IDOR in another service. The team fixes that service.

A customer asks about tenant isolation. Security writes a document.

But the class of bug remains alive.

The mature approach is different.

```text
Finding -> Pattern -> Platform control -> Test -> Telemetry -> Adoption metric
```

That is how security engineering moves from reactive fixing to systemic risk reduction.

It also changes the relationship between security and engineering. Instead of telling developers to remember more rules, security builds a paved road:

- a standard authorization vocabulary
- a reusable service middleware
- safe repository patterns
- test fixtures
- CI feedback
- runtime telemetry
- policy templates that match real product workflows

This is the Principal Product Security Engineer move: solve the bug class, not just the bug.

## Final takeaway

If you want to solve BOLA properly, do not start with a one-time pentest fix or a WAAP purchase.

Start with the authorization model.

Then build the platform capability around it:

- trusted identity from your identity provider
- coarse controls at the gateway
- service-level object authorization
- tenant-scoped data access
- service-to-service actor propagation
- automated BOLA tests
- CI/CD guardrails
- WAAP for runtime detection and abuse protection
- SIEM telemetry for suspicious access patterns
- adoption metrics that show whether the control is actually spreading

The goal is not to fix one endpoint.

The goal is to make an entire class of authorization bugs harder to create, easier to detect, and faster to eliminate.
