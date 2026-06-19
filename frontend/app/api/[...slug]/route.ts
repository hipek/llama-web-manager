import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

async function proxyRequest(req: NextRequest, path: string) {
  const url = new URL(path, API_URL)

  const searchParams = req.nextUrl.searchParams.toString()
  if (searchParams) {
    url.search = searchParams
  }

  const headers = new Headers(req.headers)
  headers.delete('host')
  headers.delete('connection')

  const init: RequestInit = {
    method: req.method,
    headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await req.text()
    init.body = body
  }

  try {
    const res = await fetch(url.toString(), init)
    const data = await res.text()

    return new NextResponse(data, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Backend unavailable' },
      { status: 502 }
    )
  }
}

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.pathname.split('/api/') as string[])[1] || ''
  return proxyRequest(req, `/${slug}`)
}

export async function POST(req: NextRequest) {
  const slug = (req.nextUrl.pathname.split('/api/') as string[])[1] || ''
  return proxyRequest(req, `/${slug}`)
}
