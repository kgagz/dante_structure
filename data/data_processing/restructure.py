import json


def transform_data(data):
    result = {"name": "Divine Comedy", "canticleCount": len(data), "children": []}

    for book_name, cantos in data.items():
        book_data = {
            "name": book_name.capitalize(),
            "cantoCount": len(cantos),
            "children": [],
        }

        for canto_num, lines in cantos.items():
            canto_data = {
                "name": f"Canto {canto_num}",
                "lineCount": len(lines),
                "children": [],
            }

            for line_num, words in lines.items():
                word_count = len(words)

                line_data = {
                    "name": f"Line {line_num}",
                    "wordCount": word_count,
                    "children": [],
                }

                for word_num, syll_count in words.items():
                    word_data = {"name": f"Word {word_num}", "syllCount": syll_count}
                    line_data["children"].append(word_data)

                canto_data["children"].append(line_data)

            book_data["children"].append(canto_data)

        result["children"].append(book_data)

    return result


# Read input
with open("commedia_structure.json", "r") as infile:
    input_data = json.load(infile)

# Transform data
transformed_data = transform_data(input_data)

# Write output
with open("restructured_commedia.json", "w") as outfile:
    json.dump(transformed_data, outfile, indent=2)
