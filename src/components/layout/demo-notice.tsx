export function DemoNotice({ tone = "page" }: { tone?: "page" | "login" | "chip" }) {
  if (tone === "chip") {
    return (
      <span className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[11px] font-semibold text-[#c45c1a]">
        Prototype
      </span>
    );
  }
  if (tone === "login") {
    return (
      <p className="mt-3 max-w-md text-xs leading-5 text-white/65">
        Demonstration. Fictional records and provisional DPE / wage-settlement figures. Not NRL AD. Not a live SBI, EPFO or TRACES connection. Data stays in this browser.
      </p>
    );
  }
  return (
    <p className="rounded-2xl bg-[#fff8f0] px-4 py-2.5 text-xs leading-5 text-[#8a4b16]">
      Prototype — fictional people, provisional policy. No NRL directory, bank or EPFO link. Records stay on this device.
    </p>
  );
}
