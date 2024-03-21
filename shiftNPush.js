/**
 * shiftNPush
 * 
 * @param {*} item 
 * @param {Float32Array} array 
 * 
 * Shift all elements of a Float32Array and adds the new item 
 * to the very list element - so sort of like a push but not really
 */
export default function shiftNPush(item, array) {
    // Shift all elements to the left
    for (let i = 1; i < array.length; i++) {
        array[i - 1] = array[i];
    }
    // Replace the last element with the new item
    array[array.length - 1] = item;
}
