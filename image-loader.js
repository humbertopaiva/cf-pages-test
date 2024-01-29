export default function imageLoader({ src }) {
  const newHostname = "static.rdstation.com";
  const newSrc = src.replace("resdigitais.wpenginepowered.com", newHostname);
  return newSrc;
}
