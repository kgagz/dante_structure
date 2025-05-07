import json


def transform_data(data, rhyme_data, letter_data, word_data):
    result = {"name": "Divine Comedy", "canticleCount": len(data), "children": []}

    for book_name, cantos in data.items():
        book_data = {
            "name": book_name.capitalize(),
            "cantoCount": len(cantos),
            "children": [],
        }

        for canto_num, lines in cantos.items():
            canto_data = {
                "name": f"{canto_num}",
                "lineCount": len(lines),
                "children": [],
            }

            for line_num, words in lines.items():
                word_count = len(words)

                line_data = {
                    "name": f"{line_num}",
                    "wordCount": word_count,
                    "first_letter": letter_data[book_name][canto_num][line_num],
                    "rhyme": rhyme_data[book_name][canto_num][line_num],
                    "children": [],
                }

                for word_num, syll_count in words.items():
                    word_entry = {
                        "name": f"{word_num}",
                        "syllCount": syll_count,
                        "text": word_data[book_name][canto_num][line_num][word_num],
                    }
                    line_data["children"].append(word_entry)

                canto_data["children"].append(line_data)

            book_data["children"].append(canto_data)

        result["children"].append(book_data)

    return result


# Read input
with open("../text/commedia_structure.json", "r") as infile:
    input_data = json.load(infile)

with open("../text/commedia_rhymes.json", "r") as infile:
    rhyme_data = json.load(infile)

with open("../text/commedia_line_letters.json", "r") as infile:
    letter_data = json.load(infile)

with open("../text/commedia_words.json", "r") as infile:
    word_data = json.load(infile)

# Transform data
transformed_data = transform_data(input_data, rhyme_data, letter_data, word_data)

# Write output
with open("restructured_commedia.json", "w") as outfile:
    json.dump(transformed_data, outfile, indent=2)
