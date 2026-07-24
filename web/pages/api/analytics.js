import { Horizon } from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';


const CACHE_FILE_PATH = path.join(process.cwd(), 'analytics_cache.json');
const CACHE_DURATION = 10 * 60 * 1000; 


function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading cache file:", err);
  }
  return null;
}

// نوشتن کش روی فایل
function writeCache(data) {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing cache file:", err);
  }
}

async function updateAnalyticsData() {
  try {
    const operatorAddress = process.env.NEXT_PUBLIC_OPERATOR_ADDRESS || "GCT2EGRCG7W5T3HGG2DFR2PBR65BZHIUBLO6DP3SVGHXTBIXNH3SX7YT";
    const server = new Horizon.Server("https://horizon-testnet.stellar.org");

    const startDate = new Date("2026-07-12T00:00:00Z");

    let allTransactions = [];
    let cursor = undefined;
    let fetchMore = true;
    let stopFetching = false;

    while (fetchMore && !stopFetching) {
      let query = server.transactions()
        .forAccount(operatorAddress)
        .limit(200)
        .order('desc');

      if (cursor) {
        query = query.cursor(cursor);
      }

      const page = await query.call();
      const records = page.records;

      if (records && records.length > 0) {
        for (const tx of records) {
          const txDate = new Date(tx.created_at);
          if (txDate < startDate) {
            stopFetching = true;
            break;
          }
          allTransactions.push(tx);
        }

        if (!stopFetching) {
          cursor = records[records.length - 1].paging_token;
          if (records.length < 200) {
            fetchMore = false;
          }
        }
      } else {
        fetchMore = false;
      }
    }

    let processTipCount = 0;
    let linkAddressCount = 0;
    let totalAllowanceAmount = 0;
    let totalVolumeAmount = 0;
    const totalTransactions = allTransactions.length;

    for (const tx of allTransactions) {
      if (tx.successful) {
        try {
          const operations = await tx.operations();
          for (const op of operations.records) {
            if (op.type === 'invoke_host_function' && op.parameters) {
              
              let functionName = "";
              for (const param of op.parameters) {
                if (param.type === 'Sym' && param.value) {
                  functionName = Buffer.from(param.value, 'base64').toString('utf8');
                  break;
                }
              }

              if (functionName.includes('process_tip')) {
                processTipCount++;
                const i128Params = op.parameters.filter(p => p.type === 'I128' && p.value);
                if (i128Params.length > 0) {
                  try {
                    const targetParam = i128Params[i128Params.length - 1];
                    const bufferVal = Buffer.from(targetParam.value, 'base64');
                    const rawNumber = Number(bufferVal.readBigUInt64BE(bufferVal.length >= 8 ? bufferVal.length - 8 : 0)) / 10000000;
                    if (!isNaN(rawNumber) && rawNumber < 1000000) {
                      totalVolumeAmount += rawNumber;
                    }
                  } catch (err) {}
                }
              } else if (functionName.includes('link_address')) {
                linkAddressCount++;
              } else if (functionName.includes('approve')) {
                const i128Params = op.parameters.filter(p => p.type === 'I128' && p.value);
                if (i128Params.length > 0) {
                  try {
                    const targetParam = i128Params[i128Params.length - 1];
                    const bufferVal = Buffer.from(targetParam.value, 'base64');
                    const rawNumber = Number(bufferVal.readBigUInt64BE(bufferVal.length >= 8 ? bufferVal.length - 8 : 0)) / 10000000;
                    if (!isNaN(rawNumber) && rawNumber < 10000000) {
                      totalAllowanceAmount += rawNumber;
                    }
                  } catch (err) {}
                }
              }

            }
          }
        } catch (innerErr) {}
      }
    }

    const newCacheData = {
      walletsCount: linkAddressCount,
      transactionsCount: processTipCount,
      totalAllowance: Math.round(totalAllowanceAmount).toString(),
      totalVolume: Math.round(totalVolumeAmount).toString(),
      totalTransactions: totalTransactions,
      lastFetchTime: Date.now()
    };

    writeCache(newCacheData);
    console.log("========== FILE CACHE UPDATED SUCCESSFULLY ==========");
    return newCacheData;

  } catch (error) {
    console.error("Background Sync Error:", error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    let cache = readCache();
    const now = Date.now();


    if (!cache || (now - cache.lastFetchTime > CACHE_DURATION)) {

      if (!cache) {
        cache = await updateAnalyticsData();
        console.log("🚨 [HORIZON API REQUEST] Fetching fresh data from Stellar Blockchain...");
      } else {

        updateAnalyticsData();
        console.log("🚨 [HORIZON API REQUEST] Fetching fresh data from Stellar Blockchain...");
      }
    }

    if (!cache) {
      cache = {
        walletsCount: 0,
        transactionsCount: 0,
        totalAllowance: "0",
        totalVolume: "0",
        totalTransactions: 0
      };
    }

    return res.status(200).json(cache);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(200).json({
      walletsCount: 0,
      transactionsCount: 0,
      totalAllowance: "0",
      totalVolume: "0",
      totalTransactions: 0
    });
  }
}