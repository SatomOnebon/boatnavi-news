import type { H3Event } from 'h3'
import { setHeader } from 'h3'

export function applyCors(event: H3Event, allowCsv: string, methods = 'GET,OPTIONS') {
  const origin = event.node.req.headers.origin || ''
  const allow = (allowCsv || '').split(',').map(s => s.trim()).filter(Boolean)
  const allowAll = allow.includes('*')

  if (allowAll || (origin && allow.includes(origin))) {
    setHeader(event, 'Access-Control-Allow-Origin', allowAll ? '*' : origin)
    setHeader(event, 'Vary', 'Origin')
  }
  setHeader(event, 'Access-Control-Allow-Methods', methods)
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
  setHeader(event, 'Access-Control-Max-Age', '600') // 10分
}