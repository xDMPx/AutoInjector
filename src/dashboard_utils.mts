export function autoResizeTextArea(id: string) {
    const text_area = document.getElementById(id) as HTMLTextAreaElement;
    // recalculate the scrollHeight 
    text_area.style.height = 'auto';
    text_area.style.height = `${text_area.scrollHeight}px`;
}

export function autoIndentOnEnter(id: string, e: KeyboardEvent) {
    if (e.key !== "Enter") return;
    const text_area = document.getElementById(id) as HTMLTextAreaElement;
    if (text_area.selectionStart !== text_area.selectionEnd) return;

    e.preventDefault();
    const cursor_pos = text_area.selectionStart;
    const before = text_area.value.slice(0, cursor_pos);
    const after = text_area.value.slice(cursor_pos);

    const prev_line = before.slice(before.lastIndexOf("\n") + 1);
    const indent = getLineIndent(prev_line);

    text_area.value = `${before}\n${indent}${after}`;
    text_area.selectionStart = before.length + indent.length + 1;
    text_area.selectionEnd = before.length + indent.length + 1;
}

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
