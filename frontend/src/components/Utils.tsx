export default function PrettifyCount({ count }: { count: number }) {
    if (count >= 1000000) {
        return `${Math.floor(count / 1000000)}.${Math.floor((count % 1000000) / 100000)}M`;
    }
    if (count >= 1000) {
        return `${Math.floor(count / 1000)}.${Math.floor((count % 1000) / 10)}k`;
    }
    return count;
}

export function FormatDateTime(value: string): string {
    const d = new Date(value);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}