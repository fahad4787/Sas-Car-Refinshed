import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <PageShell title={title} description="Planned next. This screen will follow the same layout.">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Coming soon. We’ll build this after Supplier.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Sidebar navigation is ready, so adding this page later will be quick.
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

