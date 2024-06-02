export function generate () {
    let s = "";
    const str = "123456789abcdefghijklmnopqrstuvwxyz";
    for(let i=0;i<5;i++){
        s += str[Math.floor(Math.random() * str.length)];
    }
    return s;
}