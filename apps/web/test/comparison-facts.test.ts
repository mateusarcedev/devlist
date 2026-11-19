import { describe, expect, it } from 'vitest'
import { getComparisonEvidence, parseComparisonIds } from '../src/lib/comparison-facts'

const a='50e1b7f8-c809-413d-a10c-846be7f8910d'
const b='66de52f4-7fbb-4802-bf39-5a392fd40f0c'
const c='68c2ba1c-e340-49d0-94e2-5819dfc27167'

describe('evidence-backed comparison model',()=>{
  it('accepts 2 or 3 different UUIDs and rejects duplicates and invalid input',()=>{
    expect(parseComparisonIds([a,b])).toEqual([a,b])
    expect(parseComparisonIds([a,b,c])).toHaveLength(3)
    expect(parseComparisonIds([a,a])).toBeNull()
    expect(parseComparisonIds([a])).toBeNull()
    expect(parseComparisonIds([a,b,c,a])).toBeNull()
    expect(parseComparisonIds([a,'not-a-uuid'])).toBeNull()
    expect(parseComparisonIds('anything')).toBeNull()
  })
  it('provides explicitly sourced use cases, limitations and costs only for documented tools',()=>{
    const coolify=getComparisonEvidence('Coolify','https://coolify.io/')
    expect(coolify.sourceUrl).toBe('https://coolify.io/docs/core/selfhosted-cloud-comparison')
    expect(coolify.pricingNote).toContain('taxa de licença')
    expect(coolify.limitations).not.toHaveLength(0)
    expect(coolify.en?.pricingNote).toContain('license fee')

    const unknown=getComparisonEvidence('Other Tool','https://unknown.example/')
    expect(unknown.pricingNote).toBeNull()
    expect(unknown.limitations).toEqual([])
    expect(unknown.useCases).toEqual([])
    expect(unknown.sourceUrl).toBeNull()
  })
  it('does not attach pricing evidence to a different product with the same name',()=>{
    expect(getComparisonEvidence('Coolify','https://example.com').pricingNote).toBeNull()
    expect(getComparisonEvidence('Example','https://coolify.io').pricingNote).toBeNull()
    expect(getComparisonEvidence('Coolify','javascript:alert(1)').pricingNote).toBeNull()
  })
})
