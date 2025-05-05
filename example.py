people = {
    "31": {"name": "Kathryn", "house": "Leverett"},
    "10": {"name": "Kitty", "house": "Eliot"},
}

print(people.items)

for id, person in people.items():
    print(f"id: {id}, person: {person}")
    name = person["name"]
    print(f"name: {name}")

names = {name: {id}}
input(names)
names[name].add("33")

input(names)
