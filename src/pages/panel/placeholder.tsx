export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Placeholder — bu modül sırayla doldurulacak.
      </p>
    </div>
  )
}
