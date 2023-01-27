"use strict";

const button = document.getElementById("button");
const input = document.getElementById("input");
const output = document.getElementById("output");

button.addEventListener("click", () => {
    const smsList = getSmsList({text: input.value});
    const rowsList = smsList.map((sms) => {
        const smsLayout = "<div>" + `${sms}` + "</div>";
        const stringLengthLayout = "<div>" + `(string length${sms.length})` + "</div>"
        return "<div class='row'>" + `${smsLayout} ${stringLengthLayout}` + "</div>";
    });
    const layout = rowsList.reduce((acc, row) => (acc + row), "");
    output.innerHTML = layout;
});

const SINGLE_SMS_LENGTH = 140;
const DEFAULT_SMS_LENGTH_WITHOUT_SUFFIX = 136;
const TEXT_LENGTH_MULTIPLIER = 9;
const SMS_SUFFIX_DELIMITER_LENGTH = 1;
const SPACE_SYMBOL = " ";
const SPACE_BETWEEN_WORDS_LENGTH = 1;
const ONE_TEXT_SYMBOL_LENGTH = 1;
const FIRST_SYMBOL_INDEX = 0;
const ONE_SMS = 1;
const ONE_DIGIT_LENGTH = 1;
const SMS_COUNT_FOR_REWRITING_LAST_TWO_SMS = 2;
const DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER = 1;
const FIRST_SMS_INDEX_DEFAULT = 0;
const ADJUSTED_SMS_COUNT_DEFAULT = 0;

function getSmsTextSuffix(firstPart, secondPart) {
    return ` ${firstPart}/${secondPart}`;
}

function countDigits(number) {
    return (number + "").length;
}

function countWordsNumber(text) {
    return text.split(" ").length;
}

function getAverageWordLengthPerText(text) {
    const wordsCount = countWordsNumber(text);
    return text.length / wordsCount;
}

function getApproximatelySmsAmount(text) {
    return Math.ceil(text.length / DEFAULT_SMS_LENGTH_WITHOUT_SUFFIX);
}

function getSmsTextSuffixLength(
    suffixFirstPartLength,
    suffixSecondPartLength
) {
    return suffixFirstPartLength + SMS_SUFFIX_DELIMITER_LENGTH + suffixSecondPartLength;
}

function getAverageSymbolsPerSms({
    averageWordsPerSms,
    averageWordLengthPerText,
    smsTextWithoutSuffixLength
}) {
    let wordsPerSms = averageWordsPerSms;
    let averageSymbolsPerSms = averageWordsPerSms * averageWordLengthPerText;

    while(averageSymbolsPerSms > smsTextWithoutSuffixLength) {
        wordsPerSms = wordsPerSms - 1;
        averageSymbolsPerSms = wordsPerSms * averageWordLengthPerText;
    }

    return averageSymbolsPerSms;
}

function trimRight(text) {
    return text.replace(/\s+\S*$/, "");
}

function getApproximatelySmsCountForFewSms(text) {
    let nextText = text;
    let minSmsCount = 0;
    const approximatelySmsAmount = getApproximatelySmsAmount(text);
    const digitsInApproximatelySmsAmount = countDigits(approximatelySmsAmount);

    for (let i = 0; i < digitsInApproximatelySmsAmount; i++) {
        const lastDigitApproximatelySmsAmount = i + 1 === digitsInApproximatelySmsAmount;
        const textLengthMultiplierDigit =  10 ** i;
        const fullSmsAmountForCurrentTextPart = TEXT_LENGTH_MULTIPLIER * textLengthMultiplierDigit;

        const smsTextSuffixLength = getSmsTextSuffixLength(
            countDigits(textLengthMultiplierDigit),
            digitsInApproximatelySmsAmount
        );
        const smsTextWithoutSuffixLength = SINGLE_SMS_LENGTH - (smsTextSuffixLength + SPACE_BETWEEN_WORDS_LENGTH);

        const IdealCaseTextSliceUpTo = lastDigitApproximatelySmsAmount
        ?    nextText.length
        :    fullSmsAmountForCurrentTextPart * smsTextWithoutSuffixLength;
        const textPartForIdealCase = nextText.slice(FIRST_SYMBOL_INDEX, IdealCaseTextSliceUpTo);

        const averageWordLengthPerText = getAverageWordLengthPerText(textPartForIdealCase);
        const averageWordsPerSms = Math.ceil(smsTextWithoutSuffixLength / averageWordLengthPerText);
        const averageSymbolsPerSms = getAverageSymbolsPerSms({
            averageWordsPerSms,
            averageWordLengthPerText,
            smsTextWithoutSuffixLength
        });

        const fullSymbolsAmountForCurrentDigit = fullSmsAmountForCurrentTextPart * averageSymbolsPerSms;
        const endOfTheNextTextIndex = nextText.length + 1;
        const nextTextSliceFrom = lastDigitApproximatelySmsAmount
            ? endOfTheNextTextIndex
            : fullSymbolsAmountForCurrentDigit;

        const currentTextPartAfterLastSymbol = nextText[nextTextSliceFrom + ONE_TEXT_SYMBOL_LENGTH ];

        const wholeLastWordIncluded = lastDigitApproximatelySmsAmount
            ? true
            : currentTextPartAfterLastSymbol === SPACE_SYMBOL;

        nextText = wholeLastWordIncluded
            ? nextText.slice(nextTextSliceFrom)
            : trimRight(nextText.slice(nextTextSliceFrom));

        const minSmsCountCurrentForLastTextPart = nextText.length
            ? fullSmsAmountForCurrentTextPart
            : IdealCaseTextSliceUpTo / averageSymbolsPerSms;

        const minSmsCountCurrent = lastDigitApproximatelySmsAmount
            ? minSmsCountCurrentForLastTextPart
            : fullSmsAmountForCurrentTextPart;

        minSmsCount = minSmsCount + minSmsCountCurrent;
    }

    return Math.round(minSmsCount);

}

function getApproximatelySmsCount(text) {
    return text.length > SINGLE_SMS_LENGTH ? getApproximatelySmsCountForFewSms(text) : 1;
}

function getSmsTextWithoutSuffix({
    text,
    smsTextSliceUpTo,
    moreThenOneSms
}) {
    const textPart = text.slice(FIRST_SYMBOL_INDEX, smsTextSliceUpTo);
    return moreThenOneSms ? trimRight(textPart) : textPart;
}


function getSmsText(smsTextWithoutSuffix, smsTextSuffix) {
    return `${smsTextWithoutSuffix} ${smsTextSuffix}`;
}

function isSmsTextHaveFullLength(smsText) {
    return smsText.length >= SINGLE_SMS_LENGTH;
}

function isSmsCountDigitsIncrease(smsCount) {
    return countDigits(smsCount + ONE_SMS) - countDigits(smsCount) === ONE_DIGIT_LENGTH;
}

function getSmsListFromTextList(smsTextList, smsSuffixSecondPart) {
    return smsTextList.map((smsText, smsIndex) => (
        smsText + getSmsTextSuffix(
            smsIndex + DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER,
            smsSuffixSecondPart
        )
    ))
}

function getAdjustedSmsList({
    smsTextList,
    adjustedSmsCount,
    textForRewritingSmsList,
    smsCountDigitsIncrease,
    smsList
}) {
    const smsListLastSmsIndex = smsList.length - DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER;
    const lastSmsText = smsList[smsListLastSmsIndex];

    return smsCountDigitsIncrease
        ? getAdjustedSmsListForIncreasedSmsCountDigits({
            smsTextList,
            adjustedSmsCount,
            textForRewritingSmsList
        })
        : [
            ...smsList.slice(FIRST_SYMBOL_INDEX, smsListLastSmsIndex),
            ...getSmsList({
                text: trimRight(lastSmsText),
                smsCount: SMS_COUNT_FOR_REWRITING_LAST_TWO_SMS + smsListLastSmsIndex,
                firstSmsIndex: smsListLastSmsIndex
            })
        ];
}

function getAdjustedSmsListForIncreasedSmsCountDigits({
    smsTextList,
    adjustedSmsCount,
    textForRewritingSmsList
}) {
    const firstPartAdjustedSmsList = getSmsListFromTextList(smsTextList, adjustedSmsCount);
    const secondPartAdjustedSmsList = getSmsList({
        text: textForRewritingSmsList,
        smsCount: adjustedSmsCount,
        firstSmsIndex: firstPartAdjustedSmsList.length
    });
    return [...firstPartAdjustedSmsList, ...secondPartAdjustedSmsList];
}

function getSmsList({
    text,
    smsCount = getApproximatelySmsCount(text),
    firstSmsIndex = FIRST_SMS_INDEX_DEFAULT
}) {
    let nextText = text;

    let haveAtLeastOneSmsWithFullLength = false;
    let textForRewritingSmsList = "";
    let smsCountDigitsIncrease = false;

    let needToAdjustSmsList = false;
    let adjustedSmsCount = ADJUSTED_SMS_COUNT_DEFAULT;

    const smsTextList = []
    const smsList = [];

    const moreThenOneSms = text.length > SINGLE_SMS_LENGTH;

    for(let i = firstSmsIndex; i < smsCount; i++) {
        const lastSms = i === smsCount - DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER;

        const smsSerialNumber = i + DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER;

        const smsTextSuffix = moreThenOneSms ? getSmsTextSuffix(smsSerialNumber, smsCount) : "";
        const smsTextSliceUpTo = moreThenOneSms ? SINGLE_SMS_LENGTH - smsTextSuffix.length : SINGLE_SMS_LENGTH;
        const smsTextWithoutSuffix = lastSms
            ? nextText
            : getSmsTextWithoutSuffix({
            text: nextText,
            smsTextSliceUpTo,
            moreThenOneSms
        });

        const smsText = getSmsText(smsTextWithoutSuffix, smsTextSuffix);
        smsList.push(smsText);

        const haveFirstSmsWithFullLength = isSmsTextHaveFullLength(smsText) && !textForRewritingSmsList;

        if(haveFirstSmsWithFullLength) {
            textForRewritingSmsList = nextText;
            haveAtLeastOneSmsWithFullLength = true;
        }

        if(!haveAtLeastOneSmsWithFullLength) {
            smsTextList.push(smsTextWithoutSuffix);
        }

        const currentTextPartAfterLastIndex = smsTextWithoutSuffix.length + ONE_TEXT_SYMBOL_LENGTH;

        needToAdjustSmsList = smsText.length > SINGLE_SMS_LENGTH;
        adjustedSmsCount = smsCount + ONE_SMS;
        smsCountDigitsIncrease = isSmsCountDigitsIncrease(smsCount);
        nextText = nextText.slice(currentTextPartAfterLastIndex);
    }

    return needToAdjustSmsList
        ? getAdjustedSmsList({
            smsList,
            smsTextList,
            smsCountDigitsIncrease,
            adjustedSmsCount,
            textForRewritingSmsList
        })
        : smsList;
}