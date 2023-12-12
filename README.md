![REASON](https://tryreason.b-cdn.net/icon2.webp)

<h3 align="center">RΞASON</h3>
<p align="center">
  The <i>minimalistic</i> Typescript framework for building great LLM apps.
</p>

```bash
npx use-reason
```
A small demo:
```ts
import { reason } from 'tryreason'

interface Joke {
  /** Use this property to indicate the age rating of the joke */
  rating: number;
  joke: string;

  /** Use this property to explain the joke to those who did not understood it */
  explanation: string;
}

const joke = await reason<Joke>('tell me a really spicy joke')
```
The value of the `joke` object is:
```json
{
  "joke": "I'd tell you a chemistry joke but I know I wouldn't get a reaction.",
  "rating": 18,
  "explanation": "This joke is a play on words. The term 'reaction' refers to both a chemical process and a response from someone. The humor comes from the double meaning, implying that the joke might not be funny enough to elicit a response."
}
```

Yep, RΞASON *actually* utilizes your Typescript type information as the guide for the LLM. This is a **key distinction**: RΞASON uses Typescript (& JSDoc comments) at runtime to help the LLM know what to return.

We say RΞASON is "minimalistic" because it's laser-focused on three areas only:
- String parsing.
- Streaming.
- Observability (RΞASON is OpenTelemetry compatible).

At the core of **RΞASON**, we believe its the developers job to learn the new concepts that comes from this new primitive, such as prompting & retrieval. That's why **RΞASON** does not interfere on those areas — we actively stay away from them.

Whether you are creating a complex multi-agent environment or just adding a simple LLM call to an app, RΞASON can help you deliver a great experience for your user.

<br />

## Getting started
Head over to https://docs.tryreason.dev to get started & learn
