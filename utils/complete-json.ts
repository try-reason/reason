export default function completeJSON(data: string): string {
  let balance = data;

  let stack: string[] = [];
  let activeQuote = false;
  let wasEscaped = false;

  // [ {,  ]

  for (const char of data) {
    switch (char) {
      case '{':
        if (!activeQuote) stack.push('{');
        break;
      case '[':
        if (!activeQuote) stack.push('[');
        break;
      case '"':
        if (!wasEscaped) {
          if (activeQuote) {
            stack.pop();  // remove "
          } else {
            stack.push('"');
          }
          activeQuote = !activeQuote;
        }
        break;
      case '}': {
        if (!activeQuote) {
          if (stack[stack.length - 1] === '{') {
            stack.pop();
          }
          break
        }
      }
      case ']': {
        if (!activeQuote) {
          if (stack[stack.length - 1] === '[') {
            stack.pop();
          }
          break
        }
      }
      case '\\':
        wasEscaped = true;
        continue;
    }
    wasEscaped = false;
  }

  if (data.trim().endsWith(',')) {
    // remove the last comma
    balance = balance.trim().slice(0, -1);
  }

  let cleanedData = balance

  const partialKeyOrValueMatch = cleanedData.match(/("[^"]*)?[:]\s*$/);
  if (partialKeyOrValueMatch) {
    const upToLastCommaOrBrace = cleanedData.slice(0, partialKeyOrValueMatch.index).lastIndexOf(',');
    if (upToLastCommaOrBrace === -1) {
      // If no comma found, find the last opening brace {
      cleanedData = cleanedData.slice(0, cleanedData.slice(0, partialKeyOrValueMatch.index).lastIndexOf('{') + 1);
    } else {
      cleanedData = cleanedData.slice(0, upToLastCommaOrBrace) + cleanedData.slice((partialKeyOrValueMatch?.index ?? 0) + partialKeyOrValueMatch[0].length);
    }
  }

  balance = cleanedData;

  while (stack.length > 0) {
    const lastOpened = stack.pop();
    switch (lastOpened) {
      case '{':
        balance += '}';
        break;
      case '[':
        balance += ']';
        break;
      case '"':
        balance += '"';
        break;
    }
  }

  return balance;
};

// export function findIncompleteKeys(data: string): string[] {
//   const keyStack: string[] = [];
//   const pathStack: string[] = [];
//   let currentKey = '';
//   let activeQuote = false;
//   let wasEscaped = false;
//   let insideValue = false;

//   for (let i = 0; i < data.length; i++) {
//       const char = data[i];
//       switch (char) {
//           case '"':
//               if (!wasEscaped) {
//                   activeQuote = !activeQuote;

//                   if (!activeQuote && !insideValue) {
//                       pathStack.push(currentKey.trim());
//                       const fullPath = pathStack.join('.');
//                       keyStack.push(fullPath);
//                       currentKey = '';
//                   }
//               }
//               break;
//           case ':':
//               if (!activeQuote) {
//                   insideValue = true;
//               }
//               break;
//           case '{':
//           case '[':
//               if (!activeQuote) {
//                   insideValue = false;
//               }
//               break;
//           case ',':
//               if (!activeQuote) {
//                   if (insideValue) {
//                       keyStack.pop();
//                       pathStack.pop();
//                       insideValue = false;
//                   }
//               }
//               break;
//           case '}':
//           case ']':
//               if (!activeQuote) {
//                   if (keyStack.length) {
//                       keyStack.pop();
//                   }
//                   if (pathStack.length) {
//                       pathStack.pop();
//                   }
//                   insideValue = false;
//               }
//               break;
//           case '\\':
//               if (activeQuote) {
//                   wasEscaped = true;
//                   i++;  // skip the next character
//               }
//               continue;
//           default:
//               if (activeQuote && !insideValue) {
//                   currentKey += char;
//               }
//       }
//       wasEscaped = false;
//   }

//   return keyStack;
// };

export function findIncompleteKeys(data: string): string[] {
  const keyStack: string[] = [];
  const pathStack: string[] = [];
  let currentKey = ''
  let activeQuote = false;
  let wasEscaped = false;
  let insideValue = false;

  const insideOf: any[] = [];

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    switch (char) {
      case '"': {
        if (!wasEscaped) {
          activeQuote = !activeQuote;
        }

        if (!activeQuote && !insideValue) {
          pathStack.push(currentKey.trim());
          const fullPath = pathStack.join('.');
          keyStack.push(fullPath);
          currentKey = '';
        }

        break
      }
      
      case ':': {
        if (!activeQuote) {
          insideValue = true;
        }
        break
      }

      case '{': {
        if (!activeQuote) {
          if (insideOf[insideOf.length - 1]?.type === 'array') {
            currentKey = ``
            pathStack.push(`[${insideOf[insideOf.length - 1].index}]`)
            keyStack.push(`${keyStack[keyStack.length - 1]}.[${insideOf[insideOf.length - 1].index}]`)
          }
          
          insideOf.push({ type: 'object' });
          insideValue = false
        }
        break
      }

      case '[': {
        if (!activeQuote) {
          insideOf.push({ type: 'array', index: 0 });
          insideValue = false
        }
        break
      }

      case ',': {
        if (!activeQuote && insideValue) {
          if (insideOf[insideOf.length - 1]?.type === 'array') {
            insideOf[insideOf.length - 1].index!++;
          }
          insideValue = false
          keyStack.pop()
          pathStack.pop()
          currentKey = ''
        }

        // if () {}
        break
      }

      case '}': {
        if (!activeQuote) {
          insideOf.pop();

          pathStack.pop()
          keyStack.pop()
        }
        break
      }

      case ']': {
        if (!activeQuote) {
          insideOf.pop();
          
          pathStack.pop()
          // pathStack.pop()
          // keyStack.pop()
          keyStack.pop()
        }
        break
      }

      case '\\': {
        if (activeQuote) {
          wasEscaped = true;
          i++;  // skip the next character
        }
        break
      }

      default: {
        if (activeQuote && !insideValue) {
          currentKey += char;
        }

        if (insideOf[insideOf.length - 1].type === 'array' && isValidString(char) && !insideValue) {
          currentKey = ''
          insideValue = true
          pathStack.push(`[${insideOf[insideOf.length - 1].index}]`)
          keyStack.push(`${keyStack[keyStack.length - 1]}.[${insideOf[insideOf.length - 1].index}]`)
        }
      }
    }
  }

  return keyStack
}

// export function findIncompleteKeys(data: string): string[] {
//   const keyStack: string[] = [];
//   const pathStack: string[] = [];
//   let currentKey = '';
//   let activeQuote = false;
//   let wasEscaped = false;
//   let insideValue = false;

//   let arrayDepth = 0;
//   let objectDepth = 0;
//   let insideOf: any[] = [];

//   for (let i = 0; i < data.length; i++) {
//     const char = data[i];
//     switch (char) {
//       case '"':
//         if (!wasEscaped) {
//           activeQuote = !activeQuote;

//           if (!activeQuote && !insideValue && (!insideOf[insideOf.length - 1]?.inValue || insideOf[insideOf.length - 1]?.type === 'object' || insideOf.length === 0)) {
//             pathStack.push(currentKey.trim());
//             const fullPath = pathStack.join('.');
//             keyStack.push(fullPath);
//             currentKey = '';

//           } else if (!activeQuote && insideValue) {
//             let j = i + 1;
//             while (j < data.length && [' ', '\n', '\t', '\r'].includes(data[j])) {
//               j++;
//             }
//             if (j === data.length || [',', '}', ']'].includes(data[j])) {
//               if (data[j] === ']') {
//                 arrayDepth--;
//               }
//               if (data[j] === '}') {
//                 objectDepth--;
//               }
//               keyStack.pop();
//               // pathStack.pop();
//             }
//           }
//         }
//         break;
//       case ':':
//         if (!activeQuote) {
//           insideValue = true;
//         }
//         break;
//       case '{':
//       case '[':
//         if (char === '[') {
//           insideOf.push({ type: 'array', index: 0 });
//           arrayDepth++;
//         }
//         if (char === '{') {
//           if (insideOf[insideOf.length - 1]?.type === 'array') {
//             insideOf[insideOf.length - 1].inValue = true;
//             currentKey = ``
//             pathStack.push(`[${insideOf[insideOf.length - 1].index}]`)
//             keyStack.push(`${keyStack[keyStack.length - 1]}.[${insideOf[insideOf.length - 1].index}]`)
//             // console.log(keyStack);
//             console.log('path', pathStack);
            
//           }
//           insideOf.push({ type: 'object' });
//           objectDepth++;
//         }

//         if (!activeQuote) {
//           insideValue = false;
//         }
//         break;
//       case ',':
//       case '}':
//       case ']':
//         if (!activeQuote && char === ']') {
//           insideOf.pop();
//           keyStack.pop()
//           keyStack.pop()
//           arrayDepth--;
//         }
//         if (!activeQuote && char === '}') {
//           insideOf.pop();
//           objectDepth--;
//         }

//         if (!activeQuote && char === ',') {
//           if (insideOf[insideOf.length - 1]?.type === 'array') {
//             insideOf[insideOf.length - 1].index!++;
//             insideOf[insideOf.length - 1].inValue = false
//             keyStack.pop()
//           }
//         }

//         if (!activeQuote && insideValue && insideOf[insideOf.length - 1]?.type !== 'array') {
//           keyStack.pop();
//         }
//         if (!activeQuote) {
//           if (pathStack.length) {
//             pathStack.pop();
//           }
//           insideValue = false;
//         }
//         break;
//       case '\\':
//         if (activeQuote) {
//           wasEscaped = true;
//           i++;  // skip the next character
//         }
//         continue;
//       default:
//         if (activeQuote && !insideValue) {
//           currentKey += char;
//         }

//         // simple arrays
//         if (isValidString(char) && insideOf[insideOf.length - 1]?.type === 'array' && !insideOf[insideOf.length - 1].inValue) {
//           insideOf[insideOf.length - 1].inValue = true;

//           currentKey = ``
//           pathStack.push(`[${insideOf[insideOf.length - 1].index}]`)
//           keyStack.push(`${keyStack[keyStack.length - 1]}.[${insideOf[insideOf.length - 1].index}]`)
//         }
//     }
//     wasEscaped = false;
//   }

//   return [keyStack, insideOf];
// }

function isValidString(str: string) {
  const regex = /^[A-Za-z0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]+$/;
  return regex.test(str);
}

// const abc = `{
//   "related_sites": [
//     {
//       "name": "GameSpot",
//       "brief_description": "GameSpot is a video gaming website that provides news, reviews, previews, downloads, and other information."
//     },
//     {
//       "name": "K`

// const test = `{
//   "result": [
//     {
//       "status": "active",
//       "name": {
//         "first": "Brigitte",
//         "middle": "Kai",
//         "last": "Ruecker"
//       },
//       "username": "Brigitte-Ruecker",
//       "password": "E6qVvqZ0XGdtGn7",
//       "emails": [
//         "Lucie_Mante47@example.com",
//         "Mertie.Stiedemann-White62@gmail.com"
//       ],
//       "phoneNumber": "381-601-9834 x882",
//       "location": {
//         "street": "3870 Leda Point",
//         "city": "New April",
//         "state": "North Dakota",
//         "country": "Tuvalu",
//         "zip": "17796",
//         "coordinates": {
//           "latitude": -80.1037,
//           "longitude": 108.1935
//         }
//       },
//       "website": "https://unwitting-singular.org",
//       "domain": "quick-chain.net",
//       "job": {
//         "title": "Human Group Analyst",
//         "descriptor": "Global",
//         "area": "Metrics",
//         "type": "Associate",
//         "company": "Botsford Inc"
//       },
//       "creditCard": {
//         "number": "4124-3623-1812-9324",
//         "cvv": "053",
//         "issuer": "jc`
// const test = `{
//   "p": "a",
//   "arr": {}`

// console.log(test)

// console.log(getStringDiff(completeJSON(abc), abc))
// console.log()
// console.log(JSON.parse(completeJSON(abc)))
// console.log('keys', findIncompleteKeys(abc))

// console.log();
// console.log('keys', findIncompleteKeys(test))

// const tests = [
//   `{"url_classification": "other"
// `,
//   `{"url_classification": "other"`,
//   `{\n\"classification\": \"n`,
//   `{\n\"classification\": [10, "12345`,
//   `{\n\"classification\": [10, `,
//   `{\n\"classification\": { "justification": "because yes", "classificati`,
//   `{\n\"classification\": { "justification": "a`,
//   `{\n\"classification\": { "justification": "bauce", "classification":`,
//   `{\n\"classification\": { "justification": "bauce", "classification": "bac`,
// ]

// for (const test of tests) {
//   let json = completeJSON(test)
//   try {
//     JSON.parse(json)
//     console.log(`${json} -> SUCCESS`)
//   } catch {
//     console.log(`${json} -> FAILED`)
//   }

//   console.log(findIncompleteKeys(test));
//   console.log();
// }