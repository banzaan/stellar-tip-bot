import albedo from '@albedo-link/intent';
ل
export const albedoGetPublicKey = async () => {
  try {
    const res = await albedo.publicKey({});
    return res.pubkey;
  } catch (err) {
    console.error("Albedo connection error:", err);
    throw err;
  }
};

export const albedoSignTransaction = async (xdr) => {
  try {
    const res = await albedo.tx({
      xdr: xdr,
      network: 'testnet'
    });
    return res.signedTxXdr;
  } catch (err) {
    console.error("Albedo signing error:", err);
    throw err;
  }
};