export interface DocMetadata {
  id: string
  title: string
  description?: string
  category?: string
  order?: number
}

export interface DocContent {
  id: string
  title: string
  description?: string
  content: string
  category?: string
  [key: string]: any
}

class DocumentationLoader {
  private sourceType: 'api' | 'fs'
  private source: string

  constructor() {
    this.source = import.meta.env.VITE_SOURCE || '/docs'
    this.sourceType = this.source.startsWith('http://') || this.source.startsWith('https://') ? 'api' : 'fs'
  }

  async getDocumentationList(): Promise<DocMetadata[]> {
    if (this.sourceType === 'api') {
      return this.getDocListFromAPI()
    } else {
      return this.getDocListFromFS()
    }
  }

  async getDocumentation(docId: string): Promise<DocContent> {
    if (this.sourceType === 'api') {
      return this.getDocFromAPI(docId)
    } else {
      return this.getDocFromFS(docId)
    }
  }

  private async getDocListFromAPI(): Promise<DocMetadata[]> {
    const url = `${this.source}/list`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch documentation list: ${response.statusText}`)
    return await response.json()
  }

  private async getDocFromAPI(docId: string): Promise<DocContent> {
    const url = `${this.source}/${docId}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch documentation: ${response.statusText}`)
    return await response.json()
  }

  private async getDocListFromFS(): Promise<DocMetadata[]> {
    const indexPath = `${this.source}/index.json`
    const response = await fetch(indexPath)
    if (!response.ok) throw new Error(`Failed to load index.json: ${response.statusText}`)
    return await response.json()
  }

  private async getDocFromFS(docId: string): Promise<DocContent> {
    const docPath = `${this.source}/${docId}.json`
    const response = await fetch(docPath)
    if (!response.ok) throw new Error(`Failed to load ${docId}.json: ${response.statusText}`)
    return await response.json()
  }

  getSourceInfo() {
    return { source: this.source, type: this.sourceType }
  }
}

export const documentationLoader = new DocumentationLoader()
