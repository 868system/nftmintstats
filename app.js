"use strict";

import { get } from 'https';
import { argv } from 'process';
import { writeFile, readFileSync } from 'fs';

import { projects } from './projects.js';
import { printCharts } from './output.js'


const myArgs = argv.slice(2);

const showError = (err) => {
    if (err) console.log(err);
}

const projectName = myArgs[0]
const project = projects(projectName);


// Preload Ethereum price data

const ethPricesRaw = readFileSync('data/eth_usd.csv', 'utf-8');
const ethPricesRows = ethPricesRaw.split(/\r\n|\n\r|\n|\r/).filter((x,i) => i>0 && x.length>0);

const ethPrices = ethPricesRows.reduce((obj, row) => {

    const rowItems = row.split(',');

    const dateYMD = rowItems[0].split('-');
    const year = dateYMD[0];
    const month = dateYMD[1] - 1; // January is 0
    const day = dateYMD[2];

    const date = new Date(year, month, day);
    const price = rowItems[5];

    return ({ ...obj, [date]: parseFloat(price)})

}, {});

const getEthPrice = (date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    return ethPrices[new Date(year, month, day)];
};


const process = (allTransfers, allTransactions) => {

    // One transfer per token only
    // (overlap is expected because of how we download from Etherscan)
    const uniqueTokenTransfers = allTransfers.filter((x, i, a) => a.findIndex((y) => y['tokenID'] == x['tokenID']) == i);

    // Construct an object containing each token's complete mint information
    // Use data from both transfers and transactions
    const tokenMints = uniqueTokenTransfers.map(thisTokenTransfer => {

        const thisTokenTransaction = allTransactions.find(x => x['isError'] == 0 && x['hash'] == thisTokenTransfer['hash']);

        if (thisTokenTransaction === undefined) {
            console.log('Warning: The contract used in transaction: \n' + thisTokenTransfer['hash'] + '\nneeds to be added to projects.js\n');
            //writeFile('data/' + projectName + '_problem_transfer.json', JSON.stringify(thisTokenTransfer), showError);
        }

        const thisTokenMint = {
            // Common fields
            'blockNumber'       : thisTokenTransfer['blockNumber'],
            'timeStamp'         : thisTokenTransfer['timeStamp'],
            'hash'              : thisTokenTransfer['hash'],
            'nonce'             : thisTokenTransfer['nonce'],
            'blockHash'         : thisTokenTransfer['blockHash'],
            'transactionIndex'  : thisTokenTransfer['transactionIndex'],
            'gas'               : thisTokenTransfer['gas'],
            'gasPrice'          : thisTokenTransfer['gasPrice'],
            'gasUsed'           : thisTokenTransfer['gasUsed'],
            'cumulativeGasUsed' : thisTokenTransfer['cumulativeGasUsed'],

            // Transfer
            'tokenID'      : thisTokenTransfer['tokenID'],
            'tokenName'    : thisTokenTransfer['tokenName'],
            'tokenSymbol'  : thisTokenTransfer['tokenSymbol'],
            'tokenDecimal' : thisTokenTransfer['tokenDecimal'],

            // Transaction
            'value'            : thisTokenTransaction['value'],
            'isError'          : thisTokenTransaction['isError'],
            'txreceipt_status' : thisTokenTransaction['txreceipt_status'],
            'methodId'         : thisTokenTransaction['methodId'],
            'functionName'     : thisTokenTransaction['functionName'],

            // Collisions Transfer
            // "from": "0x0000000000000000000000000000000000000000",
            'to'              : thisTokenTransfer['to'],
            'contractAddress' : thisTokenTransfer['contractAddress'],
            // "input": "deprecated",

            // Collisions Transaction
            // "from": "0xc4f4325490842426816764958a234857df4d150a",
            // "to": "0x160c404b2b49cbc3240055ceaee026df1e8497a0",
            // "contractAddress": "",
            'input' : thisTokenTransaction['input'],


            // Discarded
            // "confirmations": "1456461"
        };
        return thisTokenMint;

    });

    const uniqueMintTransactions = tokenMints.map((tokenMint, tokenMintIdx) => [tokenMintIdx, tokenMint['hash']]).filter((x, i, a) => a.findIndex(y => y[1] == x[1]) == i);



    // console.log(uniqueMintTransactions.length + ' unique mint transactions');
    // console.log('mint functions:');
    // console.log(uniqueFunctions);

    const mintTransactions = uniqueMintTransactions.map(tx => {

        // common
        const blockNumber       = tokenMints[tx[0]]['blockNumber'];
        const timeStamp         = tokenMints[tx[0]]['timeStamp'];
        const hash              = tokenMints[tx[0]]['hash'];
        const nonce             = tokenMints[tx[0]]['nonce'];
        const blockHash         = tokenMints[tx[0]]['blockHash'];
        const transactionIndex  = tokenMints[tx[0]]['transactionIndex'];
        const gas               = tokenMints[tx[0]]['gas'];
        const gasPrice          = tokenMints[tx[0]]['gasPrice'];
        const gasUsed           = tokenMints[tx[0]]['gasUsed'];
        const cumulativeGasUsed = tokenMints[tx[0]]['cumulativeGasUsed'];

        // transfers dataset
        const contractAddress   = tokenMints[tx[0]]['contractAddress'];
        const to                = tokenMints[tx[0]]['to'];
        const tokenName         = tokenMints[tx[0]]['tokenName'];
        const tokenSymbol       = tokenMints[tx[0]]['tokenSymbol'];
        const tokenDecimal      = tokenMints[tx[0]]['tokenDecimal'];

        // transactions dataset
        const value             = tokenMints[tx[0]]['value'];
        const isError           = tokenMints[tx[0]]['isError'];
        const txreceipt_status  = tokenMints[tx[0]]['txreceipt_status'];
        const methodId          = tokenMints[tx[0]]['methodId'];
        const functionSignature = tokenMints[tx[0]]['functionName'];

        // derived stats

        const functionName = functionSignature.split('(')[0];

        const tokenIDs = tokenMints.reduce((acc, val) => val['hash'] == tx[1] ? acc.concat(val['tokenID']) : acc, []);
        const tokenIDsString = tokenIDs.join(' ');
        const tokenCount = tokenIDs.length;

        const isoDate = new Date(parseInt(timeStamp) * 1000);
        const date = isoDate.toLocaleDateString('en-us', { year: 'numeric', month: 'numeric', day: 'numeric'});

        const priceETHUSD   = getEthPrice(isoDate);
        const valueETH      = parseFloat(value) / 1000000000000000000.0;
        const tokenValueETH = valueETH / tokenCount;
        const tokenValueUSD = tokenValueETH * priceETHUSD;

        const gasUsedETH    = parseFloat(gasUsed) * parseFloat(gasPrice) / 1000000000000000000.0;
        const gasUsedUSD    = gasUsedETH * priceETHUSD;

        const mintTransaction = {

            // transaction
            'transactionHash'   : hash,
            'minterAddress'     : to,
            'functionName'      : functionName,
            'date'              : date,

            // costs
            'priceETHUSD'       : Math.round(priceETHUSD * 100.0) / 100.0,
            'totalValue'        : Math.round(valueETH * 100000000.0) / 100000000.0,
            'tokenValueETH'     : Math.round(tokenValueETH * 100000000.0) / 100000000.0,
            'tokenValueUSD'     : Math.round(tokenValueUSD * 100.0) / 100.0,

            // gas
            'gasUsedETH'        : Math.round(gasUsedETH * 100000000.0) / 100000000.0,
            'gasUsedUSD'        : Math.round(gasUsedUSD * 100.0) / 100.0,

            // informational
            'tokenName'         : tokenName,
            'tokenSymbol'       : tokenSymbol,
            'tokenDecimal'      : tokenDecimal,
            'contractAddress'   : contractAddress,

            // stats for nerds
            'blockNumber'       : blockNumber,
            'blockHash'         : blockHash,
            'nonce'             : nonce,
            'transactionIndex'  : transactionIndex,
            'methodId'          : methodId,
            'value'             : value,
            'gasPrice'          : gasPrice,
            'gas'               : gas,
            'gasUsed'           : gasUsed,
            'cumulativeGasUsed' : cumulativeGasUsed,
            'isError'           : isError,
            'txReceiptStatus'   : txreceipt_status,
            'timeStamp'         : timeStamp,
            'isoDate'           : isoDate,
            'txTokenCount'      : tokenCount,
            'txTokenIDs'        : tokenIDsString

        };

        return mintTransaction;
    });

    const mintItems = mintTransactions.reduce((result, transaction) => {

        // duplicate the transaction's entry for each token ID it minted
        const expansion = transaction['txTokenIDs'].split(' ').reduce((acc, id) => {

            return acc.concat([{['tokenID']: id, ...transaction}]);

        }, []);

        return result.concat(expansion);

    }, []);





    const mintItemsCSV = mintItems.reduce((acc, txn) =>
        acc.concat([Object.values(txn).map(x => '"' + x + '"').join(',')]),
        [Object.keys(mintItems[0]).map(x => '"' + x + '"').join(',')]);

    writeFile('data/' + projectName + '.csv', mintItemsCSV.join('\n'), showError);


    const uniqueFunctionsRaw = mintTransactions.map(txn => [txn['methodId'], txn['functionName']]).filter((x, i, a) => a.findIndex(y => y[0] == x[0]) == i);





    const itemsTotal = mintItems.length;

    const [ethTotal, usdTotal] =
        mintItems.reduce((acc, item) =>
        [
            parseFloat(acc[0]) + item['tokenValueETH'],
            parseFloat(acc[1]) + item['tokenValueUSD'],
        ],
        [0.0, 0.0]);

    console.log([itemsTotal, ethTotal, usdTotal]);

    const functionStats = uniqueFunctionsRaw.map(x => {

        const [methodId, functionName] = x;

        const [itemsPerFunction, ethPerFunction, usdPerFunction] =
            mintItems.reduce((acc, item) =>
            item['methodId'] == methodId ? [
                parseInt(acc[0]) + 1,
                parseFloat(acc[1]) + item['tokenValueETH'],
                parseFloat(acc[2]) + item['tokenValueUSD']
            ] :
            [
                parseInt(acc[0]),
                parseFloat(acc[1]),
                parseFloat(acc[2])
            ],
            [0, 0.0, 0.0]);

        return {
            'functionName'     : functionName,
            'methodId'         : methodId,
            'itemsPerFunction' : itemsPerFunction,
            'ethPerFunction'   : ethPerFunction,
            'usdPerFunction'   : usdPerFunction
        }

    });



    console.log(functionStats);


    console.log();

    //printCharts(project, mintTransactions);









    writeFile('data/' + projectName + '_mints_ids.json', JSON.stringify(mintItems), showError);
    writeFile('data/' + projectName + '_mints_tx.json', JSON.stringify(mintTransactions), showError);
    writeFile('data/' + projectName + '_mints.json', JSON.stringify(tokenMints), showError);
    writeFile('data/' + projectName + '_transfers.json', JSON.stringify(uniqueTokenTransfers), showError);
}

const urls = ['https://api.etherscan.io/api?module=account&action=tokennfttx&address=0x0000000000000000000000000000000000000000&contractaddress=' + project.contractAddresses[0] + '&startblock=']
    .concat(project.contractAddresses.map(x => 'https://api.etherscan.io/api?module=account&action=txlist&address=' + x + '&startblock='))

const download = async (urls, _currentUrlIdx, _transfers, _transactions, _currentContent) => {

    const currentUrlIdx = _currentUrlIdx !== undefined ? _currentUrlIdx : 0;
    const transfers     = _transfers     !== undefined ? _transfers     : [];
    const transactions  = _transactions  !== undefined ? _transactions  : [];

    if (currentUrlIdx >= urls.length) {
        // Proceed to process the datasets
        process(transfers, transactions);
    }

    else {

        const url = urls[currentUrlIdx];

        // either 'txlist' or 'tokennfttx'
        const dataSet = url.split('action=')[1].split('&')[0];

        const currentContent = _currentContent !== undefined ? _currentContent : [];
        const currentBlock = currentContent.length == 0 ? 0 :
                            Math.max(...currentContent.map(x => x['blockNumber']));

        await new Promise(resolve => setTimeout(resolve, 5000));

        get(url + currentBlock, (response) => {
            const chunks = [];
            response
                .on('data', (chunk) => chunks.push(chunk))
                .on('end', () => {

                    const content = JSON.parse(chunks.join(''))['result'];
                    const updatedContent = currentContent.concat(content);

                    console.log(updatedContent.length + ' records retrieved from [' + currentUrlIdx + '] \'' + dataSet + '\'' );

                    if (content.length >= 10000) {
                        download(urls, currentUrlIdx, transfers, transactions, updatedContent);
                    }
                    else {
                        const updatedTransfers = dataSet == 'tokennfttx' ? transfers.concat(updatedContent) : transfers;
                        const updatedTransactions = dataSet == 'txlist' ? transactions.concat(updatedContent) : transactions;

                        download(urls, currentUrlIdx + 1, updatedTransfers, updatedTransactions);
                    }

                });
        });
    }
}

const start = () => {
    download(urls);
}
start();
