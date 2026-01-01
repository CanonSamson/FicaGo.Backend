// custom-types.d.ts

declare module 'express-serve-static-core' {
  interface Request {
    id?: string
    role?: "PATIENT" | "DOCTOR"
    channelRoles?: string[]
  }
}


declare module 'node-schedule' {
  export interface Job {
    cancel(): boolean
  }
  export function scheduleJob(
    date: Date,
    callback: (fireDate: Date) => void
  ): Job
}
