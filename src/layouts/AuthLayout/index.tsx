import { Outlet } from '@tanstack/react-router'

import { Container } from '@/components/Container'

export function AuthLayout() {
  return (
    <Container className="max-w-md">
      <Outlet />
    </Container>
  )
}

