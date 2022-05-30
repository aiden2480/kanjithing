/**
 * Encodes a string to binary. This repeatedly calls
 * the helper function convertCharToBinary
 * 
 * @param {String} string The string to be converted
 * @returns Binary encoded string
 */
export function encodeStringToBinary(string) {
    var raw = "";

    string.match(/./gu).map(char => {
        raw += convertCharToBinary(char);
    });

    // Add a space after every 8th character
    return raw.match(/.{8}/g).join(" ");
}

/**
 * Decodes a binary string back to a regular string
 * 
 * @param {BinaryEncodedString} binary A string encoded in binary
 * @returns The decoded string as an object
 */
export function decodeBinaryToString(binary) {
    var input = binary.split(" ");
    var output = [];

    // Construct a 2D array of bytes, where each array
    // holds each byte required for a character
    input.forEach(byte => {
        if (byte.startsWith(1) && !byte.startsWith(11)) {
    		output.at(-1).push(byte);
        } else {
            output.push([ byte ]);
        }
    });

    // Concatenate each byte back to a string
    output = output.map(item => {
        const binary2string = x => String.fromCharCode(convertBinaryToDec(x));

        // Treat the special case of one byte
		if (item.length == 1) return binary2string(item[0]);
    
        // Remove the prestring that tells us how many bytes are coming
        var decoded = item[0].slice(item.length);

        // Remove the prepadding of 10 from every byte afterwards and append
        item.slice(1).forEach(item => {
            decoded += item.slice(2);
        });
        
        return binary2string(decoded);
    }).join("");

    return output;
}

/**
 * Converts binary text to hexadecimal
 * 
 * @param {BinaryEncodedString} binary The string to be encoded to hex
 * @returns The hexadecimal representation of the binary string
 */
export function encodeBinaryToHex(binary) {
    var input = binary.replaceAll(" ", "").match(/.{4}/g);
    var conv = {
        10: "A", 11: "B", 12: "C",
        13: "D", 14: "E", 15: "F",
    }

    var output = input.map(nibble => {
        var decimal = convertBinaryToDec(nibble);
        var char = conv[decimal] || decimal;

        return char;
    });

    return output.join("");
}

/**
 * Decodes a hexadecimal string back to its binary representation
 * 
 * @param {HexEncodedString} hex The string to be decoded to binary
 * @returns Decoded binary string, seperated with a space every 8 chars
 */
export function decodeHexToBinary(hex) {
    var conv = {
        "A": 10, "B": 11, "C": 12,
        "D": 13, "E": 14, "F": 15,
    }

    var output = Array.from(hex).map(item => {
        var char = conv[item] || item;

        return convertDecToBinary(char).padStart(4, "0");
    });

    return output.join("").match(/.{8}/g).join(" ");
}

/**
 * Converts a single character to its binary
 * equivalent
 * 
 * @param {Char} char A single UTF8 character
 * @returns The binary representation of that char
 */
function convertCharToBinary(char) {
    var code = char.codePointAt(); // Lookup the UTF8 code
    var bits = convertDecToBinary(code);

    // Normally, we would take out any left padded
    // zeros, but they don't occur in the way I have
    // written the convertNumToBinary algorithm
    var numOfBytes = calcNumOfBytes(bits.length);

    // If it's just one byte, we're going to handle it
    // as a special case here because it's much easier
    if (numOfBytes == 1) {
        return bits.padStart(8, "0");
    }

    // Generate our 2D array, which contains x number of bytes.
    // Each byte is an array with length 8
    var conv = [];

    // Prepad first byte with a one for every byte used for
    // the character, and then a zero
    conv.push([
        ...Array(numOfBytes).fill(1),               // A one for every byte
        0,                                          // And then a zero
        ...Array(8 - (numOfBytes + 1)).fill(null)   // The rest are null
    ]);

    // For each remaining byte, prepad each byte with 10
    for (let i = 0; i < numOfBytes - 1; i++) {
        conv.push([1, 0, ...Array(6).fill(null)]);
    }

    // It's easier to now flatten this back into a 1D array
    // to paste in the bits
    conv = conv.flat();
    
    // Find index of last null, paste in a bit, and then
    // remove that bit from the to-be-pasted bits
    while (bits.length > 0) {
        var index = conv.lastIndexOf(null);
        conv[index] = parseInt(bits.at(-1));

        bits = bits.slice(0, -1);
    }

    // Replace any remaining spaces with zeros and return
    while (conv.indexOf(null) !== -1) {
        conv[conv.indexOf(null)] = 0;
    }

    return conv.join("");
}

/**
 * Converts a decimal number to binary by continuously
 * dividing it by two and flooring the remainder. 
 * 
 * @param {Number} num A decimal number
 * @returns Its binary equivalent
 */
function convertDecToBinary(num) {
    var concat = [];

    while (num > 0) {
        concat.push(num % 2);
        num = Math.floor(num / 2);
    }

    return concat.reverse().join("");
}

/**
 * Converts a binary encoded decimal back to a decimal
 * 
 * @param {BinaryEncodedString} bin A decimal integer in binary
 * @returns Integer
 */
function convertBinaryToDec(bin) {
    var output = 0;

    bin.split("").forEach((item, index) => {
        let power = bin.length - index - 1;
        output += parseInt(item) * 2 ** power;
    });

    return output;
}

/**
 * Calculates how many bytes are required to represent the
 * number of bits inputted. Support only added for up to four
 * bytes as necessary for UTF8/unicode encoding
 * 
 * @param {Number} numOfBits The number of bits in the string
 * @returns The number of bytes required to store those bits
 */
function calcNumOfBytes(numOfBits) {
    var opts = [7, 11, 16, 21];
    var indx = opts.find(x => numOfBits <= x);
    var byte = opts.indexOf(indx) + 1;

    // | Ben's formula | bits <= 7  | 1 byte  |
    // |---------------|------------|---------|
    // |   2 x 5 + 1   | bits <= 11 | 2 bytes |
    // |   3 x 5 + 1   | bits <= 16 | 3 bytes |
    // |   4 x 5 + 1   | bits <= 21 | 4 bytes |

    return byte;
}
