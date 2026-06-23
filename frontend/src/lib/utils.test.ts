import { formatSize, modelName } from './utils'

describe('formatSize', () => {
  test('converts bytes to MB', () => {
    expect(formatSize(1048576)).toBe('1 MB')
    expect(formatSize(2097152)).toBe('2 MB')
    expect(formatSize(0)).toBe('0 MB')
  })

  test('truncates fractional MB', () => {
    expect(formatSize(1572864)).toBe('1 MB') // 1.5 MB -> 1
  })
})

describe('modelName', () => {
  test('extracts filename from path', () => {
    expect(modelName('/models/gguf-model.Q4_K_M.gguf')).toBe('gguf-model.Q4_K_M.gguf')
  })

  test('returns input when no slash', () => {
    expect(modelName('simple.gguf')).toBe('simple.gguf')
  })

  test('returns empty string for null', () => {
    expect(modelName(null)).toBe('')
  })
})
