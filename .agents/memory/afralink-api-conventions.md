---
name: AfraLink API conventions
description: Mutation signatures, field names, and UI patterns that are easy to get wrong in AfraLink
---

## Mutation signatures (Orval-generated)

- Creates: `mutate({data: {...}})`
- Updates with ID: `mutate({id: number, data: {...}})`
- Approvals: `mutate({id: number})`
- Reject driver: `mutate({id, data: {note}})`

## File uploads

```ts
const result = await requestUpload.mutateAsync({data:{name, size, contentType}});
await fetch(result.uploadURL, {method:"PUT", body: file, headers:{"Content-Type": file.type}});
// result.objectPath is the stored path
```

## States/cities API shape

`useListStates()` returns `{states: [{id, name, region}]}` — use `s.name`, NOT `s.state`.
`useListCities({state})` returns `{cities: [{id, name, stateId, stateName}]}` — use `c.name`, NOT `c.city`.

## SelectItem

Radix UI SelectItem does NOT allow `value=""`. Use real sentinel values or don't include an "All" item (instead use placeholder text).

## WhatsApp links

```ts
`https://wa.me/234${phone.replace(/^(\+234|0)/, "")}?text=...`
```

## AuthUser type

`useAuth().user` from `@workspace/replit-auth-web` does NOT have `role` or `profilePhotoUrl` on its TypeScript type (those come from the DB). Cast as `(user as any)?.role` when needed.

**Why:** The Replit auth library AuthUser type only has OIDC standard fields; AfraLink extends the user with DB columns not reflected in the type.
