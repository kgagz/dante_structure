"""
`extract_data.py` extracts all of the data information from the texts of Inferno, Purgatorio, and Paradiso.
"""

# Helper class to convert Roman numerals to integers from https://medium.com/@AlexanderObregon/solving-the-roman-to-integer-problem-on-leetcode-python-solutions-walkthrough-0b3d7be445a9
import json
import re
from tqdm import tqdm


class Solution(object):
    def romanToInt(self, s):
        sum = 0
        prevValue = 0
        value = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}

        for c in s:
            currentValue = value[c]
            sum += (
                (currentValue - 2 * prevValue)
                if (currentValue > prevValue)
                else currentValue
            )
            prevValue = currentValue
        return sum


# Helper function to read each canticle given its title
def read_canticle(canticle):
    data = {}
    rhyme_data = {}
    first_letter_data = {}
    get_arabic_num = Solution()
    canto_num = 0
    with open(f"../text/{canticle}_syllnew.txt", "r", encoding="utf-8") as file:
        for line in file:
            # input(f"line: {line}")
            # Check if beginning of new canto
            heading = f"{canticle.capitalize()} • Canto "
            # input(f"heading: {heading}")
            if line == "\n":
                # input(f"empty line, skipping")
                continue
            elif heading in line[: len(heading)]:
                # input(f"heading in line")
                stripped_line = line[len(heading) :].strip()
                # input(f"line.strip(heading): {stripped_line}")
                canto_num = get_arabic_num.romanToInt(stripped_line)
                # input(f"canto_num = {canto_num}")
                data[canto_num] = {}
                rhyme_data[canto_num] = {}
                first_letter_data[canto_num] = {}
                continue
            else:
                # input(f"in else statement")
                line_num = re.sub(r"[^0-9]", "", line[:4]).strip()
                # input(f"line[:4].strip(): {line_num}")
                line_num = int(line_num)
                # print(f"line_num: {line_num}")
                words = line[4:].split()
                # input(f"words: {words}")
                data[canto_num][line_num] = {}
                rhyme = ("").join(words[-1].split("|")[-2:]).strip("|\\,.!;:?»\n")
                rhyme = re.sub(
                    r"^.*?(?=([aeiouàáâäæãåāèéêëēėęîïíīįìôöòóœøōõûüùúūÿ])(?![aeiouàáâäæãåāèéêëēėęîïíīįìôöòóœøōõûüùúūÿ]))",
                    "",
                    rhyme,
                    count=1,
                )
                # input(f"rhyme: {rhyme}")
                first_letter = words[0][1]
                # input(f"first_letter: {first_letter}")
                rhyme_data[canto_num][line_num] = rhyme
                first_letter_data[canto_num][line_num] = first_letter
                for i in range(len(words)):
                    # input(words[i].split("|"))
                    # input(len(words[i].split("|")) - 1)
                    data[canto_num][line_num][i + 1] = len(words[i].split("|")) - 1
                continue
    return data, rhyme_data, first_letter_data


def main():
    canticles = ["inferno", "purgatorio", "paradiso"]
    data = {}
    rhyme_data = {}
    first_letter_data = {}
    for canticle in tqdm(canticles):
        data[canticle], rhyme_data[canticle], first_letter_data[canticle] = (
            read_canticle(canticle)
        )

    with open("../text/commedia_structure.json", "w") as f:
        json.dump(data, f, indent=4, sort_keys=True, ensure_ascii=False)

    with open("../text/commedia_rhymes.json", "w") as f:
        json.dump(rhyme_data, f, indent=4, sort_keys=True, ensure_ascii=False)

    with open("../text/commedia_line_letters.json", "w") as f:
        json.dump(first_letter_data, f, indent=4, sort_keys=True, ensure_ascii=False)


if __name__ == "__main__":
    main()
