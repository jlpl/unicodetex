// lexer.js

import { language } from "./language.js";

const COMMANDS = Object.keys(language)
    .filter(key => key.length > 1)
    .sort((a, b) => b.length - a.length);

export function lex(input) {

    const tokens = [];

    let i = 0;

    while (i < input.length) {

        //--------------------------------------------------
        // Preserve ordinary spaces
        //--------------------------------------------------
        
        if (input[i] === " ") {
        
            let value = "";
        
            while (
        
                i < input.length &&
        
                input[i] === " "
        
            ) {
        
                value += input[i];
        
                i++;
        
            }
        
            tokens.push({
        
                type: "text",
        
                value
        
            });
        
            continue;
        
        }
        
        //--------------------------------------------------
        // Skip tabs and newlines
        //--------------------------------------------------
        
        if (
        
            input[i] === "\t" ||
        
            input[i] === "\n" ||
        
            input[i] === "\r"
        
        ) {
        
            i++;
        
            continue;
        
        }

        //--------------------------------------------------
        // LaTeX command
        //--------------------------------------------------

        if (input[i] === "\\") {

            i++;

            let matched = null;

            for (const cmd of COMMANDS) {

                if (input.startsWith(cmd, i)) {

                    matched = cmd;
                    break;

                }

            }

            if (!matched) {

                throw new Error(
                    "Unknown command \\" +
                    input.slice(i).match(/^[A-Za-z]+/)?.[0]
                );

            }

            const info = language[matched];

            tokens.push({

                type: info.type,
                value: matched,
                info

            });

            i += matched.length;
            continue;

        }

        //--------------------------------------------------
        // Single-character language token
        //--------------------------------------------------

        const ch = input[i];

        if (language[ch]) {

            const info = language[ch];

            tokens.push({

                type: info.type,
                value: ch,
                info

            });

            i++;
            continue;

        }

        //--------------------------------------------------
        // Plain text
        //--------------------------------------------------

        tokens.push({

            type: "text",
            value: ch

        });

        i++;

    }

    return tokens;

}