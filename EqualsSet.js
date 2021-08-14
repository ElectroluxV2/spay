export class EqualsSet extends Set {

    #checkObject(object) {
        if (!'equals' in object) throw new Error(`Wrong object for EqualSet`);
    }

    add(object) {
       this.#checkObject(object);

       if (this.has(object)) return;

       super.add(object);
    }

    has(object) {
        this.#checkObject(object);

        for (const test of super.values()) {
            if (test.equals(object)) return true;
        }

        return false;
    }

    combineWith(otherSet) {
        for (const object of otherSet.values()) {
            this.add(object);
        }
    }
}