export interface Activity {
  id: string
  appName: string
  domainName: string | null
  title: string
  duration: number // in seconds
  isClassified: boolean
  isProductive: boolean
}

export interface Session {
  id: string
  date: string
  duration: number // in seconds
  activities: Activity[]
}

export interface Rule {
  id: string
  type: "app" | "domain"
  name: string
  isProductive: boolean
  createdAt: string
}

