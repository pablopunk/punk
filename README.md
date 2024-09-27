# Punk

> The no-build web framework

## Requirements

You need [`bun.sh`](https://bun.sh).

## Install

```bash
npm install punk
```

## Run

### React

Create a `pages/index.tsx`. You can use **React and Typescript without any config**.

```tsx
export default function App() {
  return <h1>No future</h1>
}
```

Run the cli:

```bash
$ punk
```

Visit [localhost:3000](https://localhost:3000) and that's it!

### API routes

You can also create HTTP endpoints. Just create a non-jsx file (no `x` in the file extension) like `pages/users.ts`:

```ts
export default async function (req: Request): Promise<Response> {
  const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];
  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
}
```

And that's it! You have an API at [localhost:3000/users](https://localhost:3000/users).