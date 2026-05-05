import { Container, Logo } from '@/components'
import { Button } from '@/components/ui'

export function HomePage() {
  return (
    <Container>
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
        <Logo className="h-24 w-auto" />
        <div className="text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight">
            Sas Car Refinish
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Hello World</p>
        </div>
        <Button variant="outline">Welcome</Button>
      </main>
    </Container>
  )
}

