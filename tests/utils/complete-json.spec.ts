import { test, expect } from 'bun:test'
import completeJSON from '../../utils/complete-json'

test('completeJSON case 1', () => {
  let incomplete = `{
    "url_classification": "videogame-related",
    "related_sites": [
      {
        "name": "GameSpot",
        "url": "https://www.gamespot.com",
        "brief_description": "GameSpot is a video gaming website that provides news, reviews, previews, downloads, and other information."
      },
      {
        "name": "K`

  let complete = {
    "url_classification": "videogame-related",
    "related_sites": [
      {
        "name": "GameSpot",
        "url": "https://www.gamespot.com",
        "brief_description": "GameSpot is a video gaming website that provides news, reviews, previews, downloads, and other information."
      },
      {
        "name": "K"
      }
    ]
  }

  try {
    const data = JSON.parse(completeJSON(incomplete))
    expect(data).toEqual(complete)
  } catch (e) {
    expect(true).toBe(false)
  }
})