function arraysOfObjectsAreEqual<T extends object>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; i++) {
    const obj1Record = arr1[i] as Record<string, unknown>
    const obj2Record = arr2[i] as Record<string, unknown>

    const keys1 = Object.keys(obj1Record)
    const keys2 = Object.keys(obj2Record)

    if (keys1.length !== keys2.length) {
      return false
    }

    for (const key of keys1) {
      if (obj1Record[key] !== obj2Record[key]) {
        return false
      }
    }
  }

  return true
}
export default arraysOfObjectsAreEqual
