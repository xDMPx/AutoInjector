
export function getLineIndent(line: string): string {
    let i = 0;
    while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
        i++;
    }
    return line.slice(0, i);
}

export function shortToast(msg: string) {
    const toast = document.getElementById("toast")!;
    toast.style.display = "block";
    const toast_msg = document.getElementById("toast-text")!;
    toast_msg.innerText = msg;
    setTimeout(() => {
        const toast = document.getElementById("toast")!;
        toast.style.display = "none";
    }, 300);
}
