import QRCode from "qrcode";
import { getParty, joinUrl } from "@/lib/parties";
import { SharePanel } from "./share-panel";

export default async function SharePage({
  params,
}: PageProps<"/admin/[partyId]/share">) {
  const { partyId } = await params;
  const party = (await getParty(partyId))!;
  const url = joinUrl(party.joinCode);
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return (
    <SharePanel
      code={party.joinCode}
      url={url}
      qrSvg={qrSvg}
      partyName={party.name}
    />
  );
}
