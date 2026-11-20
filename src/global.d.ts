interface ShotflowFilter {
  name: string
  extensions: string[]
}

interface ShotflowApi {
  load(): Promise<string | null>
  save(json: string): Promise<boolean>
  saveFile(opts: { defaultName: string; filters: ShotflowFilter[]; data: string }): Promise<boolean>
  openFile(opts: { filters: ShotflowFilter[] }): Promise<{ name: string; data: string } | null>
  exportPdf(defaultName: string): Promise<boolean>
}

interface Window {
  shotflow?: ShotflowApi
}
