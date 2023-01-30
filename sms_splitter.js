"use strict";


const button = document.getElementById("button");
const input = document.getElementById("input");
const output = document.getElementById("output");

button.addEventListener("click", () => {
    const smsTextList = getSmsTextList({text: input.value});
    const smsList = getSmsListFromTextList(smsTextList, smsTextList.length);
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
const DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER = 1;
const FIRST_SMS_INDEX_DEFAULT = 0;
const UNDEFINED = undefined;

function getPluralSmsTextSuffix(firstPart, secondPart) {
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
        const averageWordsPerSms = Math.floor(smsTextWithoutSuffixLength / averageWordLengthPerText);
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

        const currentTextPartAfterLastSymbol = nextText[nextTextSliceFrom + ONE_TEXT_SYMBOL_LENGTH];

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

    return Math.ceil(minSmsCount);

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
    const textPartAfterLastSymbol = text[smsTextSliceUpTo];
    const wholeLastWordIncluded = textPartAfterLastSymbol === SPACE_SYMBOL;
    const adjustedTextPart = wholeLastWordIncluded ? textPart : trimRight(textPart);
    return moreThenOneSms ? adjustedTextPart : textPart;
}


function getSmsText(smsTextWithoutSuffix, smsTextSuffix) {
    return `${smsTextWithoutSuffix}${smsTextSuffix}`;
}

function isSmsTextHaveFullLength(smsText) {
    return smsText.length >= SINGLE_SMS_LENGTH;
}

function isSmsCountDigitsIncrease({
    firstSmsIndex,
    smsCount,
    needToAdjustSmsList
}) {
    const callGetSmsTextListNotJustOnce = firstSmsIndex !== FIRST_SMS_INDEX_DEFAULT;
    const increaseByNextSms = needToAdjustSmsList
        && (countDigits(smsCount + ONE_SMS) - countDigits(smsCount))
        === ONE_DIGIT_LENGTH;
    const increaseByNextSmsCount = callGetSmsTextListNotJustOnce
        && (countDigits(smsCount) - countDigits(firstSmsIndex)) === ONE_DIGIT_LENGTH;
    return increaseByNextSms || increaseByNextSmsCount;
}

function getSmsListFromTextList(smsTextList, smsSuffixSecondPart) {
    return smsTextList.map((smsText, smsIndex) => (
        smsText + getPluralSmsTextSuffix(
            smsIndex + DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER,
            smsSuffixSecondPart
        )
    ))
}

function getAdjustedSmsList({
    smsTextList,
    textForRewritingSmsList,
    smsCountDigitsIncrease,
    firstSmsWithFullLengthIndex,
    lastSmsIndex
}) {
    const lastSmsSerialNumber = lastSmsIndex + DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER;
    const lastSmsText = smsTextList[smsTextList.length - DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER];

    return smsCountDigitsIncrease
        ? getAdjustedSmsTextListForIncreasedSmsCountDigits({
            smsTextListBeforeFirstSmsWithFullLength: smsTextList.slice(
                FIRST_SMS_INDEX_DEFAULT,
                firstSmsWithFullLengthIndex
            ),
            adjustedSmsCount: getApproximatelySmsCount(lastSmsText) + lastSmsSerialNumber,
            textForRewritingSmsList,
            firstSmsIndex: firstSmsWithFullLengthIndex
        })
        : [
            ...smsTextList.slice(FIRST_SYMBOL_INDEX, lastSmsIndex),
            ...getSmsTextList({
                text: lastSmsText,
                smsCount: getApproximatelySmsCount(lastSmsText) + lastSmsSerialNumber,
                firstSmsIndex: lastSmsIndex
            })
        ];
}

function getAdjustedSmsTextListForIncreasedSmsCountDigits({
    smsTextListBeforeFirstSmsWithFullLength,
    adjustedSmsCount,
    textForRewritingSmsList,
    firstSmsIndex
}) {
    const firstPartAdjustedSmsList = smsTextListBeforeFirstSmsWithFullLength;
    const secondPartAdjustedSmsList = getSmsTextList({
        text: textForRewritingSmsList,
        smsCount: adjustedSmsCount,
        firstSmsIndex
    });
    return [...firstPartAdjustedSmsList, ...secondPartAdjustedSmsList];
}

function getNextTextBySmsTextWithoutSuffix(nextText, smsTextWithoutSuffix) {
    const nextSmsTextFirstSymbolIndex = smsTextWithoutSuffix.length;
    return nextText.slice(nextSmsTextFirstSymbolIndex + ONE_TEXT_SYMBOL_LENGTH);
}

function getSmsTextSuffix({moreThenOneSms, smsCount, smsIndex}) {
    const smsSerialNumber = smsIndex + DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER;
    return moreThenOneSms ? getPluralSmsTextSuffix(smsSerialNumber, smsCount) : "";
}

function getSmsTextSliceUpTo(moreThenOneSms, smsTextSuffix) {
    return moreThenOneSms
        ? SINGLE_SMS_LENGTH - smsTextSuffix.length
        : SINGLE_SMS_LENGTH;
}

function isLastSms({nextText, smsTextSliceUpTo, smsCount, smsIndex}) {
    const lastSmsIndex = smsCount - DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER;
    const nextTextShorterThenOneSms = nextText[smsTextSliceUpTo] === UNDEFINED;
    return smsIndex === lastSmsIndex || nextTextShorterThenOneSms;
}

function getTextForRewritingSmsList({smsText, nextText, textForRewritingSmsList}) {
    const haveFirstSmsWithFullLength = isSmsTextHaveFullLength(smsText) && !textForRewritingSmsList;

    return haveFirstSmsWithFullLength ? nextText : textForRewritingSmsList;
}

function getFirstSmsWithFullLengthIndex({smsText, smsIndex, textForRewritingSmsList}) {
    const haveFirstSmsWithFullLength = isSmsTextHaveFullLength(smsText) && !textForRewritingSmsList;
    return haveFirstSmsWithFullLength ? smsIndex : UNDEFINED;
}

function getSmsTextList({
    text,
    smsCount = getApproximatelySmsCount(text),
    firstSmsIndex = FIRST_SMS_INDEX_DEFAULT
}) {
    let nextText = text;

    let textForRewritingSmsList = "";
    let smsCountDigitsIncrease = false;

    let needToAdjustSmsList = false;

    const smsTextList = [];
    let firstSmsWithFullLengthIndex;
    const lastSmsIndex = smsCount - DIFFERENCE_BETWEEN_SMS_INDEX_AND_SMS_SERIAL_NUMBER;

    const moreThenOneSms = text.length > SINGLE_SMS_LENGTH;

    for(let i = firstSmsIndex; i < smsCount; i++) {
        const smsTextSuffix = getSmsTextSuffix({moreThenOneSms, smsCount, smsIndex: i});
        const smsTextSliceUpTo = getSmsTextSliceUpTo(moreThenOneSms, smsTextSuffix);
        const lastSms = isLastSms({nextText, smsTextSliceUpTo, smsCount, smsIndex: i});
        const smsTextWithoutSuffix = lastSms
            ? nextText
            : getSmsTextWithoutSuffix({
            text: nextText,
            smsTextSliceUpTo,
            moreThenOneSms
        });

        const smsText = getSmsText(smsTextWithoutSuffix, smsTextSuffix);
        smsTextList.push(smsTextWithoutSuffix);

        textForRewritingSmsList = getTextForRewritingSmsList({
            smsText,
            nextText,
            textForRewritingSmsList
        });
        firstSmsWithFullLengthIndex = getFirstSmsWithFullLengthIndex({
            smsText,
            smsIndex: i,
            textForRewritingSmsList
        });

        needToAdjustSmsList = smsText.length > SINGLE_SMS_LENGTH;
        smsCountDigitsIncrease = isSmsCountDigitsIncrease({
            firstSmsIndex,
            smsCount,
            needToAdjustSmsList
        })

        if (lastSms) {
            break;
        }

        nextText = getNextTextBySmsTextWithoutSuffix(nextText, smsTextWithoutSuffix);
    }

    return needToAdjustSmsList
        ? getAdjustedSmsList({
            smsTextList,
            smsCountDigitsIncrease,
            textForRewritingSmsList,
            firstSmsWithFullLengthIndex,
            lastSmsIndex
        })
        : smsTextList;
}