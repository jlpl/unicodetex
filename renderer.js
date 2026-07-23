import { language } from "./language.js";


export function renderBlock(ast) {

    return render(ast).lines.join("\n");

}

function makeBlock(lines, baseline = 0, attachment = null) {

    //--------------------------------------------------
    // Determine width
    //--------------------------------------------------

    const width =
        Math.max(...lines.map(line => line.length), 0);

    //--------------------------------------------------
    // Pad all lines
    //--------------------------------------------------

    const padded =
        lines.map(line => line.padEnd(width));

    //--------------------------------------------------
    // Height
    //--------------------------------------------------

    const height =
        padded.length;

    //--------------------------------------------------
    // Default attachment anchors
    //--------------------------------------------------

    if (attachment === null) {

        attachment = {

            upper: {

                row: 0,

                column: width

            },

            lower: {

                row: height - 1,

                column: width

            }

        };

    }

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return {

        lines: padded,

        width,

        height,

        baseline,

        attachment

    };

}


const LAYOUT = {

    fractionGap: 0,

    limitGap: 1,

    attachmentGap: 1,

    matrixColumnGap: 1,

    matrixRowGap: 1,

    radicalGap: 0

};

function placeBlock(block, height, baseline) {

    const top =
        baseline - block.baseline;

    const bottom =
        height - top - block.height;

    const lines = [];

    for(let i=0;i<top;i++)
        lines.push(" ".repeat(block.width));

    lines.push(...block.lines);

    for(let i=0;i<bottom;i++)
        lines.push(" ".repeat(block.width));

    return lines;

}



function concat(left, right) {

    //--------------------------------------------------
    // New baseline
    //--------------------------------------------------

    const baseline = Math.max(

        left.baseline,

        right.baseline

    );

    //--------------------------------------------------
    // Space above baseline
    //--------------------------------------------------

    const above = baseline;

    //--------------------------------------------------
    // Space below baseline
    //--------------------------------------------------

    const below = Math.max(

        left.height - left.baseline - 1,

        right.height - right.baseline - 1

    );

    //--------------------------------------------------
    // Total height
    //--------------------------------------------------

    const height = above + below + 1;

    //--------------------------------------------------
    // Align both blocks vertically
    //--------------------------------------------------

    const leftLines =

        placeBlock(

            left,

            height,

            baseline

        );

    const rightLines =

        placeBlock(

            right,

            height,

            baseline

        );

    //--------------------------------------------------
    // Join rows
    //--------------------------------------------------

    const lines = [];

    for (let i = 0; i < height; i++) {

        lines.push(

            leftLines[i] +

            rightLines[i]

        );

    }

    //--------------------------------------------------
    // Attachment coordinates
    //--------------------------------------------------

    const leftOffset =

        baseline - left.baseline;

    const rightOffset =

        baseline - right.baseline;

    const attachment = {

        upper: {

            row:
                left.attachment.upper.row
                + leftOffset,

            column:
                left.attachment.upper.column

        },

        lower: {

            row:
                left.attachment.lower.row
                + leftOffset,

            column:
                left.attachment.lower.column

        }

    };

    //--------------------------------------------------
    // If the right block contains the rightmost
    // attachment point, use it instead.
    //--------------------------------------------------

    if (

        right.attachment.upper.column + left.width >

        attachment.upper.column

    ) {

        attachment.upper = {

            row:

                right.attachment.upper.row +

                rightOffset,

            column:

                right.attachment.upper.column +

                left.width

        };

    }

    if (

        right.attachment.lower.column + left.width >

        attachment.lower.column

    ) {

        attachment.lower = {

            row:

                right.attachment.lower.row +

                rightOffset,

            column:

                right.attachment.lower.column +

                left.width

        };

    }

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return makeBlock(

        lines,

        baseline,

        attachment

    );

}


function horizontal(blocks) {

    if (blocks.length === 0) {

        return makeBlock([""]);

    }

    let result = blocks[0];

    for (let i = 1; i < blocks.length; i++) {

        result = concat(

            result,

            blocks[i]

        );

    }

    return result;

}


function center(text, width) {

    const left = Math.floor(

        (width - text.length) / 2

    );

    const right =

        width - text.length - left;

    return (

        " ".repeat(left) +

        text +

        " ".repeat(right)

    );

}



function render(node) {

    switch (node.type) {

        //--------------------------------------------------
        // Root document
        //--------------------------------------------------

        case "document":

            return horizontal(
                node.children.map(render)
            );

        //--------------------------------------------------
        // Plain grouping {...}
        //--------------------------------------------------

        case "group":

            return horizontal(
                node.children.map(render)
            );

        //--------------------------------------------------
        // Plain text
        //--------------------------------------------------

        case "text":

            return makeBlock([
                node.value
            ]);

        //--------------------------------------------------
        // Glyphs
        //--------------------------------------------------

        case "glyph":

            return renderGlyph(node);

        //--------------------------------------------------
        // Structures
        //--------------------------------------------------

        case "fraction":

            return renderFraction(node);

        case "sqrt":

            return renderSqrt(node);

        case "abs":
        
            return renderAbs(node);

        case "matrix":

            return renderMatrix(node);

        case "delimiter":

            return renderDelimiter(node);

        //--------------------------------------------------
        // Attachments
        //--------------------------------------------------

        case "attachment":

            return renderAttachment(node);

        //--------------------------------------------------

        default:

            throw new Error(
                "Unknown node type: " + node.type
            );

    }

}


function renderGlyph(node) {

    //--------------------------------------------------
    // Attachment anchors
    //--------------------------------------------------

    let attachment = null;

    if (node.info.attachment) {

        attachment = {

            upper: {

                row: 0,

                column: node.info.unicode.length

            },

            lower: {

                row: 0,

                column: node.info.unicode.length

            }

        };

    }

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return makeBlock(

        [

            node.info.unicode

        ],

        0,

        attachment

    );

}

function renderAttachment(node) {

    //--------------------------------------------------
    // Render base
    //--------------------------------------------------

    const base = render(

        node.base

    );

    //--------------------------------------------------
    // Render scripts
    //--------------------------------------------------

    const upper =

        node.upper

            ? render(node.upper)

            : null;

    const lower =

        node.lower

            ? render(node.lower)

            : null;

    //--------------------------------------------------
    // Determine attachment style
    //--------------------------------------------------

    const attachment =

        node.base.info?.attachment ?? {

            style: "scripts"

        };

    //--------------------------------------------------
    // Render attachments
    //--------------------------------------------------

    return renderAttachments(

        base,

        upper,

        lower,

        attachment

    );

}


function renderAttachments(base, upper, lower, attachment) {

    //--------------------------------------------------
    // Nothing to attach
    //--------------------------------------------------

    if (!upper && !lower) {

        return base;

    }

    //--------------------------------------------------
    // Default style
    //--------------------------------------------------

    const style =
        attachment?.style ?? "scripts";

    switch (style) {

        case "limits":

            return renderLimits(

                base,

                upper,

                lower

            );

        case "scripts":

        default:

            return renderScripts(

                base,

                upper,

                lower

            );

    }

}



function renderScripts(base, upper, lower) {

    //--------------------------------------------------
    // Attachment anchors
    //--------------------------------------------------

    const upperAnchor =
        base.attachment?.upper ?? {

            row: 0,

            column: base.width

        };

    const lowerAnchor =
        base.attachment?.lower ?? {

            row: base.height - 1,

            column: base.width

        };

    //--------------------------------------------------
    // Script dimensions
    //--------------------------------------------------

    const upperHeight =
        upper ? upper.height : 0;

    const lowerHeight =
        lower ? lower.height : 0;

    //--------------------------------------------------
    // Space required above and below the base
    //--------------------------------------------------

    const above = Math.max(
    
        upper
            ? upperHeight
              + LAYOUT.attachmentGap
              - upperAnchor.row
              - 1
            : 0,
    
        0
    
    );

    const below = Math.max(

        lower
            ? lowerAnchor.row
              + LAYOUT.attachmentGap
              + lowerHeight
              - base.height
            : 0,

        0

    );

    //--------------------------------------------------
    // Result dimensions
    //--------------------------------------------------

    const baseline =
        above + base.baseline;

    const height =
        above +
        base.height +
        below;

    const scriptWidth = Math.max(

        upper ? upper.width : 0,

        lower ? lower.width : 0

    );

    const width = Math.max(

        base.width,

        Math.max(
            upperAnchor.column,
            lowerAnchor.column
        ) + scriptWidth

    );

    //--------------------------------------------------
    // Empty canvas
    //--------------------------------------------------

    const lines = Array.from(

        { length: height },

        () => Array(width).fill(" ")

    );

    //--------------------------------------------------
    // Draw base
    //--------------------------------------------------

    for (let i = 0; i < base.height; i++) {

        const row = above + i;

        for (let j = 0; j < base.width; j++) {

            lines[row][j] =
                base.lines[i][j];

        }

    }

    //--------------------------------------------------
    // Draw superscript
    //--------------------------------------------------

    if (upper) {

        const row =
            above + upperAnchor.row
            - upper.height
            - LAYOUT.attachmentGap
            + 1;

        const col =
            upperAnchor.column;

        for (let i = 0; i < upper.height; i++) {

            for (let j = 0; j < upper.width; j++) {

                lines[row + i][col + j] =
                    upper.lines[i][j];

            }

        }

    }

    //--------------------------------------------------
    // Draw subscript
    //--------------------------------------------------

    if (lower) {

        const row =
            above + lowerAnchor.row
            + LAYOUT.attachmentGap;

        const col =
            lowerAnchor.column;

        for (let i = 0; i < lower.height; i++) {

            for (let j = 0; j < lower.width; j++) {

                lines[row + i][col + j] =
                    lower.lines[i][j];

            }

        }

    }

    //--------------------------------------------------
    // New attachment anchors
    //--------------------------------------------------

    const attachment = {

        upper: {

            row: 0,

            column: width

        },

        lower: {

            row: height - 1,

            column: width

        }

    };

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return makeBlock(

        lines.map(row => row.join("")),

        baseline,

        attachment

    );

}


function renderLimits(base, upper, lower) {

    //--------------------------------------------------
    // Width
    //--------------------------------------------------

    const width = Math.max(

        base.width,

        upper ? upper.width : 0,

        lower ? lower.width : 0

    );

    const lines = [];

    //--------------------------------------------------
    // Upper limit
    //--------------------------------------------------

    if (upper) {

        for (const line of upper.lines) {

            lines.push(

                center(line, width)

            );

        }

        for (

            let i = 0;

            i < LAYOUT.limitGap;

            i++

        ) {

            lines.push(

                " ".repeat(width)

            );

        }

    }

    //--------------------------------------------------
    // Base
    //--------------------------------------------------

    const baseline =

        lines.length +

        base.baseline;

    for (const line of base.lines) {

        lines.push(

            center(line, width)

        );

    }

    //--------------------------------------------------
    // Lower limit
    //--------------------------------------------------

    if (lower) {

        for (

            let i = 0;

            i < LAYOUT.limitGap;

            i++

        ) {

            lines.push(

                " ".repeat(width)

            );

        }

        for (const line of lower.lines) {

            lines.push(

                center(line, width)

            );

        }

    }

    //--------------------------------------------------
    // Attachment anchors
    //--------------------------------------------------

    const attachment = {

        upper: {

            row: 0,

            column: width

        },

        lower: {

            row: lines.length - 1,

            column: width

        }

    };

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return makeBlock(

        lines,

        baseline,

        attachment

    );

}

function renderFraction(node) {

    const numerator = render(

        node.numerator

    );

    const denominator = render(

        node.denominator

    );

    //--------------------------------------------------
    // Width
    //--------------------------------------------------

    const width = Math.max(

        numerator.width,

        denominator.width

    );

    //--------------------------------------------------
    // Horizontal padding
    //--------------------------------------------------

    const numLeft = Math.floor(

        (width - numerator.width) / 2

    );

    const numRight =

        width - numerator.width - numLeft;

    const denLeft = Math.floor(

        (width - denominator.width) / 2

    );

    const denRight =

        width - denominator.width - denLeft;

    //--------------------------------------------------
    // Lines
    //--------------------------------------------------

    const lines = [];

    //--------------------------------------------------
    // Numerator
    //--------------------------------------------------

    for (const line of numerator.lines) {

        lines.push(

            " ".repeat(numLeft) +

            line +

            " ".repeat(numRight)

        );

    }

    //--------------------------------------------------
    // Fraction bar
    //--------------------------------------------------

    lines.push(

        "─".repeat(width)

    );

    //--------------------------------------------------
    // Denominator
    //--------------------------------------------------

    for (const line of denominator.lines) {

        lines.push(

            " ".repeat(denLeft) +

            line +

            " ".repeat(denRight)

        );

    }

    //--------------------------------------------------
    // Attachment anchors
    //--------------------------------------------------

    const attachment = {

        upper: {

            row: 0,

            column: width

        },

        lower: {

            row: lines.length - 1,

            column: width

        }

    };

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return makeBlock(

        lines,

        numerator.height,

        attachment

    );

}




function fraction(numerator, denominator) {

    //--------------------------------------------------
    // Width
    //--------------------------------------------------

    const width = Math.max(

        numerator.width,

        denominator.width

    );

    //--------------------------------------------------
    // Lines
    //--------------------------------------------------

    const lines = [];

    //--------------------------------------------------
    // Numerator
    //--------------------------------------------------

    for (const line of numerator.lines) {

        lines.push(

            center(line, width)

        );

    }

    //--------------------------------------------------
    // Fraction bar
    //--------------------------------------------------

    lines.push(

        "─".repeat(width)

    );

    //--------------------------------------------------
    // Denominator
    //--------------------------------------------------

    for (const line of denominator.lines) {

        lines.push(

            center(line, width)

        );

    }

    //--------------------------------------------------
    // Attachment anchors
    //--------------------------------------------------

    const attachment = {

        upper: {

            row: 0,

            column: width

        },

        lower: {

            row: lines.length - 1,

            column: width

        }

    };

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return makeBlock(

        lines,

        numerator.height,

        attachment

    );

}





function renderDelimiter(node) {

    //--------------------------------------------------
    // Render contents
    //--------------------------------------------------

    const body = render(

        node.body

    );

    //--------------------------------------------------
    // Single-line delimiters
    //--------------------------------------------------

    if (body.height === 1) {

        return horizontal([

            makeBlock([node.left]),

            body,

            makeBlock([node.right])

        ]);

    }

    //--------------------------------------------------
    // Multi-line delimiters
    //--------------------------------------------------

    return stretchDelimiter(

        node.left,

        node.right,

        body,

    );

}




function stretchDelimiter(left, right, body) {

    //--------------------------------------------------
    // Single-line delimiter
    //--------------------------------------------------

    if (body.height === 1) {

        return makeBlock(

            [

                left +

                body.lines[0] +

                right

            ],

            body.baseline,

            {

                upper: {

                    row: 0,

                    column: body.width + 2

                },

                lower: {

                    row: 0,

                    column: body.width + 2

                }

            }

        );

    }

    //--------------------------------------------------
    // Determine symmetric height
    //--------------------------------------------------

    const above =

        body.baseline;

    const below =

        body.height

        - body.baseline

        - 1;

    const extent =

        Math.max(

            above,

            below

        );

    const height =

        2 * extent + 1;

    const baseline =

        extent;

    //--------------------------------------------------
    // Place body in symmetric canvas
    //--------------------------------------------------

    const bodyLines =

        placeBlock(

            body,

            height,

            baseline

        );

    //--------------------------------------------------
    // Delimiter pieces
    //--------------------------------------------------

    const L = {

        "(": ["⎛", "⎜", "⎝"],

        "[": ["⎡", "⎢", "⎣"],

        "|": ["│", "│", "│"]

    };

    const R = {

        ")": ["⎞", "⎟", "⎠"],

        "]": ["⎤", "⎥", "⎦"],

        "|": ["│", "│", "│"]

    };

    const leftPieces =

        L[left];

    const rightPieces =

        R[right];

    //--------------------------------------------------
    // Assemble rows
    //--------------------------------------------------

    const lines = [];

    for (

        let i = 0;

        i < height;

        i++

    ) {

        let l;

        let r;

        if (i === 0) {

            l = leftPieces[0];

            r = rightPieces[0];

        }
        else if (

            i === height - 1

        ) {

            l = leftPieces[2];

            r = rightPieces[2];

        }
        else {

            l = leftPieces[1];

            r = rightPieces[1];

        }

        lines.push(

            l +

            bodyLines[i] +

            r

        );

    }

    //--------------------------------------------------
    // Attachment anchors
    //--------------------------------------------------

    const attachment = {

        upper: {

            row: 0,

            column: body.width + 2

        },

        lower: {

            row: height - 1,

            column: body.width + 2

        }

    };

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return makeBlock(

        lines,

        baseline,

        attachment

    );

}


function renderAbs(node) {

    const body = render(node.body);

    return stretchDelimiter(

        "|",

        "|",

        body

    );

}



function renderSqrt(node) {

    const body = render(

        node.body

    );

    return sqrt(

        body

    );

}

function sqrt(body) {

    //--------------------------------------------------
    // Dimensions
    //--------------------------------------------------

    const H = body.height;

    const leftWidth = H + 1;

    const width =
        leftWidth + body.width;

    const height =
        H + 1;

    //--------------------------------------------------
    // Empty canvas
    //--------------------------------------------------

    const lines = Array.from(

        { length: height },

        () => Array(width).fill(" ")

    );

    //--------------------------------------------------
    // Roof "─"
    //--------------------------------------------------

    for (

        let j = 0;

        j <= body.width;

        j++

    ) {

        lines[0][leftWidth + j] = "_";

    }

    //--------------------------------------------------
    // Diagonal
    //--------------------------------------------------

    for (

        let i = 0;

        i < H - 1;

        i++

    ) {

        const row = i + 1;

        const col = H - i;

        lines[row][col] = "╱";

    }

    //--------------------------------------------------
    // Bottom hook
    //--------------------------------------------------

    lines[H][0] = "╲";
    lines[H][1] = "╱";

    //--------------------------------------------------
    // Body
    //--------------------------------------------------

    for (

        let i = 0;

        i < H;

        i++

    ) {

        const row = i + 1;

        for (

            let j = 0;

            j < body.width;

            j++

        ) {

            lines[row][leftWidth + j] =
                body.lines[i][j];

        }

    }

    //--------------------------------------------------
    // Attachment anchors
    //--------------------------------------------------

    const attachment = {

        upper: {

            row: 0,

            column: width

        },

        lower: {

            row: height - 1,

            column: width

        }

    };

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return makeBlock(

        lines.map(

            row => row.join("")

        ),

        body.baseline + 1,

        attachment

    );

}


//--------------------------------------------------
// MATRICES
//--------------------------------------------------


function padCell(

    cell,

    width,

    height,

    baseline

) {

    //--------------------------------------------------
    // Vertical padding
    //--------------------------------------------------

    const placed =

        placeBlock(

            cell,

            height,

            baseline

        );

    //--------------------------------------------------
    // Horizontal padding
    //--------------------------------------------------

    const left = Math.floor(

        (width - cell.width) / 2

    );

    const right =

        width - cell.width - left;

    //--------------------------------------------------
    // Pad the whole block
    //--------------------------------------------------

    const lines = placed.map(

        line =>

            " ".repeat(left) +

            line +

            " ".repeat(right)

    );

    //--------------------------------------------------
    // Shift attachment anchors
    //--------------------------------------------------

    const attachment = {

        upper: {

            row:

                cell.attachment.upper.row +

                (baseline - cell.baseline),

            column:

                cell.attachment.upper.column +

                left

        },

        lower: {

            row:

                cell.attachment.lower.row +

                (baseline - cell.baseline),

            column:

                cell.attachment.lower.column +

                left

        }

    };

    return makeBlock(

        lines,

        baseline,

        attachment

    );

}

function renderMatrixRow(cells) {

    const pieces = [];

    for (let i = 0; i < cells.length; i++) {

        if (i > 0) {

            pieces.push(

                makeBlock([

                    " ".repeat(

                        LAYOUT.matrixColumnGap

                    )

                ])

            );

        }

        pieces.push(

            cells[i]

        );

    }

    return horizontal(

        pieces

    );

}

function assembleMatrixBody(rows) {

    const gap =

        LAYOUT.matrixRowGap;

    const width =

        rows[0].width;

    const lines = [];

    for (

        let r = 0;

        r < rows.length;

        r++

    ) {

        lines.push(

            ...rows[r].lines

        );

        if (

            r !== rows.length - 1

        ) {

            for (

                let i = 0;

                i < gap;

                i++

            ) {

                lines.push(

                    " ".repeat(width)

                );

            }

        }

    }

    //--------------------------------------------------
    // Baseline
    //--------------------------------------------------

    let baseline;

    const rowHeight =

        rows[0].height;

    const pitch =

        rowHeight + gap;

    if (

        rows.length % 2 === 1

    ) {

        const middle =

            Math.floor(

                rows.length / 2

            );

        baseline =

            middle * pitch +

            rows[0].baseline;

    }
    else {

        const upper =

            rows.length / 2 - 1;

        baseline =

            (upper + 1) * pitch - 1;

    }

    return makeBlock(

        lines,

        baseline

    );

}

function renderMatrix(node) {

    //--------------------------------------------------
    // Render every cell
    //--------------------------------------------------

    const rendered =

        node.rows.map(row =>

            row.map(render)

        );

    //--------------------------------------------------
    // Cell dimensions
    //--------------------------------------------------

    const all =

        rendered.flat();

    const cellWidth = Math.max(

        ...all.map(

            c => c.width

        )

    );

    const cellHeight = Math.max(

        ...all.map(

            c => c.height

        )

    );

    const cellBaseline = Math.max(

        ...all.map(

            c => c.baseline

        )

    );

    //--------------------------------------------------
    // Pad cells
    //--------------------------------------------------

    const padded =

        rendered.map(row =>

            row.map(cell =>

                padCell(

                    cell,

                    cellWidth,

                    cellHeight,

                    cellBaseline

                )

            )

        );

    //--------------------------------------------------
    // Render rows
    //--------------------------------------------------

    const renderedRows =

        padded.map(

            renderMatrixRow

        );

    //--------------------------------------------------
    // Matrix body
    //--------------------------------------------------

    const body =

        assembleMatrixBody(

            renderedRows

        );

    //--------------------------------------------------
    // Surround with parentheses
    //--------------------------------------------------

    return stretchDelimiter(

        "(",

        ")",

        body

    );

}