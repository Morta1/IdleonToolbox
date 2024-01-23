interface Window {
  gtag?: any; // Assuming gtag is a property of the global Window object
}

interface ValueAndBreakdown {
  value: number;
  breakdown: { name?: string, value?: number, title?: string }[]
}

interface Account {
  [key: string]: any;
}

interface Character {
  [key: string]: any;
}

interface Data {
  account: Account;
  characters: Character[]
}

interface IdleonData {
  [key: string]: any;
}