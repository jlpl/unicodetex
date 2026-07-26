import { lex } from "./lexer.js";
import { parse } from "./parser.js";
import { renderBlock } from "./renderer.js";

const input =
    document.getElementById("latexInput");

const output =
    document.getElementById("unicodeOutput");

const copyButton =
    document.getElementById("copyButton");

const clearButton =
    document.getElementById("clearButton");

function update() {

    try {

        const tokens =
            lex(input.value);

        const ast =
            parse(tokens);

        output.textContent =
            renderBlock(ast);

    }

    catch (error) {

        output.textContent =
            "Error:\n\n" +
            error.message;

    }

}

input.addEventListener(

    "input",

    update

);

copyButton.addEventListener(

    "click",

    async () => {

        try {

            await navigator.clipboard.writeText(

                output.textContent

            );

        }

        catch (error) {

            console.error(error);

        }

    }

);

clearButton.addEventListener(

    "click",

    () => {

        input.value = "";

        output.textContent = "";

        input.focus();

    }

);

update();





const examples = [

    {

        title: "Matrix",

        latex:
        "F^{\\mu\\nu} = \\matrix{{0,-\\frac{E_x}{c},-\\frac{E_y}{c},-\\frac{E_z}{c}}{\\frac{E_x}{c},0,-B_z,B_y}{\\frac{E_y}{c},B_z,0,-B_x}{\\frac{E_z}{c},-B_y,B_z,0}}"

    },

    {

        title: "Fraction",

        latex:
        "\\varphi = \\frac{1}{1 + \\frac{1}{1 + \\frac{1}{1 + ...}}}"

    },

    {

        title: "Sum",

        latex:
        "\\zeta(x) = \\sum_{n=1}^{\\infty} (\\frac{1}{n^x}) = 1 + \\frac{1}{2^x} + \\frac{1}{3^x} + \\frac{1}{4^x} + ..."

    },

    {

        title: "Integral",

        latex:
        "\\int_{0}^{\\infty} (\\frac{sin^2\\theta}{\\theta})d\\theta = \\frac{\\pi}{2}"

    },

    {

        title: "Root",

        latex:
        "\\sigma =\\sqrt{\\frac{1}{N}\\sum_{i=1}^{N}(x_i- \\mu)^2}"

    },

    {

        title: "Modulus",

        latex:
        "\\abs{e^{i\\theta}} = 1"

    },

    {

        title: "Limit",

        latex:
        "e = \\lim_{n \\rightarrow \\infty} (1 + \\frac{1}{n})^n \\approx 2.71828..."

    }

];

document

.querySelectorAll(".example")

.forEach((button, index) => {

    button.onclick = () => {

        latexInput.value =

            examples[index].latex;

        update();

    };

});