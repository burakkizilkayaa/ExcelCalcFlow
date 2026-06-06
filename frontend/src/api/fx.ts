import client from './client'

export interface FXRates {
  usd_to_try: number
  eur_to_try: number
}

export const getLatestRates = () => client.get<FXRates>('/fx/latest')
