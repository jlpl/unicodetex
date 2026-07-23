// parser.js

export function parse(tokens) {

    let pos = 0;

    //--------------------------------------------------
    // Helpers
    //--------------------------------------------------

    function current() {
        return tokens[pos];
    }

    function atEnd() {
        return pos >= tokens.length;
    }

    function advance() {
        return tokens[pos++];
    }

    //--------------------------------------------------
    // Document
    //--------------------------------------------------

    function parseDocument() {

        return {

            type: "document",

            children: parseSequence()

        };

    }

    //--------------------------------------------------
    // Sequence
    //--------------------------------------------------

    function parseSequence(stopToken = null) {

        const children = [];

        while (!atEnd()) {

            const token = current();

            //--------------------------------------------------
            // End of group?
            //--------------------------------------------------

            if (

                stopToken &&

                token.type === "grouping" &&

                token.value === stopToken

            ) {

                break;

            }

            children.push(

                parseElement()

            );

        }

        return children;

    }

    //--------------------------------------------------
    // Element
    //--------------------------------------------------

    function parseElement() {

        let node = parsePrimary();

        //--------------------------------------------------
        // Attachments
        //--------------------------------------------------

        let lower = null;

        let upper = null;

        while (

            !atEnd() &&

            current().type === "attachment"

        ) {

            const attachment = advance();

            const field =
                attachment.info.field;

            const value =
                parseArgument();

            if (field === "lower")

                lower = value;

            else if (field === "upper")

                upper = value;

        }

        if (

            lower !== null ||

            upper !== null

        ) {

            return {

                type: "attachment",

                base: node,

                lower,

                upper

            };

        }

        return node;

    }

    //--------------------------------------------------
    // Primary
    //--------------------------------------------------

    function parsePrimary() {

        const token = advance();

        switch (token.type) {

            //--------------------------------------------------
            // Plain text
            //--------------------------------------------------

            case "text":

                return {

                    type: "text",

                    value: token.value

                };

            //--------------------------------------------------
            // Glyph
            //--------------------------------------------------

            case "glyph":

                return {

                    type: "glyph",

                    name: token.value,

                    info: token.info

                };

            //--------------------------------------------------
            // Structure
            //--------------------------------------------------

            case "structure":

                return parseStructure(token);

            //--------------------------------------------------
            // Group
            //--------------------------------------------------

            case "grouping":

                if (token.value !== "{")

                    throw new Error(

                        "Unexpected '}'"

                    );

                const children =

                    parseSequence("}");

                if (

                    atEnd()

                )

                    throw new Error(

                        "Missing '}'"

                    );

                advance();

                return {

                    type: "group",

                    children

                };

            //--------------------------------------------------
            // Delimiter
            //--------------------------------------------------

            case "delimiter":

                return parseDelimiter(token);

            default:

                throw new Error(

                    "Unexpected token " +

                    token.type

                );

        }

    }

    //--------------------------------------------------
    // Structures
    //--------------------------------------------------

    function parseStructure(token) {
    
        //--------------------------------------------------
        // Matrix has its own parser
        //--------------------------------------------------
    
        if (token.info.node === "matrix") {
    
            return parseMatrix(token);
    
        }
    
        //--------------------------------------------------
        // Generic structures
        //--------------------------------------------------
    
        const node = {
    
            type: token.info.node
    
        };
    
        for (
    
            const field of
    
            token.info.fields
    
        ) {
    
            node[field] =
    
                parseArgument();
    
        }
    
        return node;
    
    }


    function parseMatrix(token) {
    
        //--------------------------------------------------
        // Matrix begins with {
        //--------------------------------------------------
    
        const body = parseArgument();
    
        if (body.type !== "group") {
    
            throw new Error(
                "Matrix body must be enclosed in {}."
            );
    
        }
    
        //--------------------------------------------------
        // Parse rows
        //--------------------------------------------------
    
        const rows = [];
    
        for (const rowGroup of body.children) {
    
            if (rowGroup.type !== "group") {
    
                throw new Error(
                    "Each matrix row must be enclosed in {}."
                );
    
            }
    
            const row = [];
    
            let currentCell = [];
    
            for (const node of rowGroup.children) {
    
                //--------------------------------------------------
                // Comma separates cells
                //--------------------------------------------------
    
                if (
    
                    node.type === "text" &&
    
                    node.value === ","
    
                ) {
    
                    row.push({
    
                        type: "group",
    
                        children: currentCell
    
                    });
    
                    currentCell = [];
    
                    continue;
    
                }
    
                currentCell.push(node);
    
            }
    
            //--------------------------------------------------
            // Last cell
            //--------------------------------------------------
    
            row.push({
    
                type: "group",
    
                children: currentCell
    
            });
    
            rows.push(row);
    
        }
    
        //--------------------------------------------------
        // Check rectangularity
        //--------------------------------------------------
    
        if (rows.length > 0) {
    
            const cols = rows[0].length;
    
            for (const row of rows) {
    
                if (row.length !== cols) {
    
                    throw new Error(
    
                        "All matrix rows must have the same number of columns."
    
                    );
    
                }
    
            }
    
        }
    
        //--------------------------------------------------
        // Result
        //--------------------------------------------------
    
        return {
    
            type: "matrix",
    
            rows
    
        };
    
    }
    

    //--------------------------------------------------
    // Delimiters
    //--------------------------------------------------

    function parseDelimiter(token) {
    
        const children = [];
    
        let closed = false;
    
        while (!atEnd()) {
    
            const next = current();
    
            if (
    
                next.type === "text" &&
    
                next.value === token.info.right
    
            ) {
    
                advance();
    
                closed = true;
    
                break;
    
            }
    
            children.push(
                parseElement()
            );
    
        }
    
        if (!closed) {
    
            throw new Error(
    
                "Missing closing delimiter '" +
    
                token.info.right +
    
                "'"
    
            );
    
        }
    
        return {
    
            type: "delimiter",
    
            left: token.info.left,
    
            right: token.info.right,
    
            body: {
    
                type: "group",
    
                children
    
            }
    
        };
    
    }

    //--------------------------------------------------
    // Arguments
    //--------------------------------------------------

    function parseArgument() {

        if (

            current()?.type === "grouping" &&

            current().value === "{"

        ) {

            return parsePrimary();

        }

        return parseElement();

    }

    //--------------------------------------------------

    return parseDocument();

}