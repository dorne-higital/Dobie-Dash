<script setup lang="ts">
/**
 * Make your dog: breed, coat, ears, tail, eyes and a name. Dobie (the Doberman) is free;
 * other breeds unlock with Golden Bones (or money, from M4). Any breed you own can take
 * any coat, ears, tail and eye colour, all free.
 */
import { BREEDS, EARS, EYES, TAILS, makeDog } from '~/game/art/dobie'
import { BREED_PRICING } from '~/logic/items'
import { dobie, type DogSave } from '~/logic/save'
import { ownsBreed } from '~/logic/shop'
import { breedProduct } from '~/logic/store'

const props = withDefaults(defineProps<{ cta?: string }>(), { cta: 'Save' })
const emit = defineEmits<{ saved: [dog: DogSave] }>()

const player = usePlayerStore()
const draft = reactive<DogSave>({ ...(player.dog ?? dobie()) })
const breeds = Object.entries(BREEDS)

const worn = useLook()
const look = computed(() => ({
  dog: makeDog(draft.breed, {
    coat: draft.coat,
    ears: draft.ears,
    tail: draft.tail,
    eye: draft.eyes,
  }),
  acc: worn.value.acc,
  trail: null,
}))
const breedLook = (key: string) => ({ dog: makeDog(key), acc: {}, trail: null })
const coats = computed(() => BREEDS[draft.breed]!.coats)
const owned = computed(() => ownsBreed(player, draft.breed))
const canAfford = computed(() => player.bones >= BREED_PRICING.bones)
const nameOk = computed(() => draft.name.trim().length > 0)

function pickBreed(key: string) {
  const b = BREEDS[key]!
  draft.breed = key
  draft.coat = 0
  draft.ears = b.ears === 'mixed' ? 'up' : b.ears
  draft.tail = b.tail
}

function swatch(i: number) {
  const p = coats.value[i]![1]
  const second = p.spots ?? p.patch ?? p.legLow ?? p.muzzle ?? p.chest ?? p.base
  return `linear-gradient(135deg, ${p.base} 55%, ${second} 55%)`
}

const { analytics } = useServices()
function unlock() {
  if (player.buyBreed(draft.breed) === 'bought')
    analytics.track('item_buy', {
      item: `breed:${draft.breed}`,
      price: BREED_PRICING.bones,
      currency: 'bones',
    })
}

const purchases = usePurchases()
onMounted(purchases.loadPrices)
function buyBreedMoney() {
  void purchases.buy(breedProduct(draft.breed), 'maker')
}
function buyAll() {
  void purchases.buy('breeds.all', 'maker')
}

function save() {
  if (!owned.value || !nameOk.value) return
  const dog = { ...draft, name: draft.name.trim().slice(0, 16) }
  player.setDog(dog)
  emit('saved', dog)
}
</script>

<template>
  <div class="maker">
    <div class="preview">
      <DogView :look="look" mode="idle" />
      <span v-if="!owned" class="lock"><UiIcon name="lock" /> {{ BREEDS[draft.breed]!.name }}</span>
    </div>

    <label class="name">
      <span>Name</span>
      <input v-model="draft.name" maxlength="16" placeholder="Your dog's name" autocomplete="off" />
    </label>

    <section>
      <h3>Breed</h3>
      <div class="breeds">
        <button
          v-for="[key, b] in breeds"
          :key="key"
          type="button"
          class="breed"
          :class="{ on: draft.breed === key }"
          :aria-pressed="draft.breed === key"
          @click="pickBreed(key)"
        >
          <span class="face"><DogView :look="breedLook(key)" mode="head" /></span>
          <span class="bn">{{ b.name }}</span>
          <span v-if="!ownsBreed(player, key)" class="price"
            ><UiIcon name="bone" /> {{ BREED_PRICING.bones }}</span
          >
        </button>
      </div>
    </section>

    <section>
      <h3>Coat · {{ coats[draft.coat]?.[0] }}</h3>
      <div class="row">
        <button
          v-for="(c, i) in coats"
          :key="c[0]"
          type="button"
          class="dot"
          :class="{ on: draft.coat === i }"
          :style="{ background: swatch(i) }"
          :aria-label="c[0]"
          :aria-pressed="draft.coat === i"
          @click="draft.coat = i"
        />
      </div>
    </section>

    <section>
      <h3>Ears</h3>
      <div class="row">
        <button
          v-for="[k, label] in EARS"
          :key="k"
          type="button"
          class="chip"
          :class="{ on: draft.ears === k }"
          :aria-pressed="draft.ears === k"
          @click="draft.ears = k"
        >
          {{ label }}
        </button>
      </div>
    </section>

    <section>
      <h3>Tail</h3>
      <div class="row">
        <button
          v-for="[k, label] in TAILS"
          :key="k"
          type="button"
          class="chip"
          :class="{ on: draft.tail === k }"
          :aria-pressed="draft.tail === k"
          @click="draft.tail = k"
        >
          {{ label }}
        </button>
      </div>
    </section>

    <section>
      <h3>Eyes</h3>
      <div class="row">
        <button
          v-for="[k, label, col] in EYES"
          :key="k"
          type="button"
          class="chip"
          :class="{ on: draft.eyes === k }"
          :aria-pressed="draft.eyes === k"
          @click="draft.eyes = k"
        >
          <i class="eye" :style="{ background: col }" />{{ label }}
        </button>
      </div>
    </section>

    <div class="bar">
      <template v-if="owned">
        <UiButton big :disabled="!nameOk" @click="save">{{ props.cta }}</UiButton>
        <p v-if="!nameOk" class="hint">Give your dog a name</p>
      </template>
      <template v-else>
        <UiButton big :disabled="!canAfford" @click="unlock">
          Unlock for <UiIcon name="bone" /> {{ BREED_PRICING.bones }}
        </UiButton>
        <div class="money">
          <UiButton variant="secondary" :disabled="!!purchases.busy.value" @click="buyBreedMoney">
            {{ purchases.price(breedProduct(draft.breed)) }}
          </UiButton>
          <UiButton variant="secondary" :disabled="!!purchases.busy.value" @click="buyAll">
            Every breed {{ purchases.price('breeds.all') }}
          </UiButton>
        </div>
        <p class="hint">
          <template v-if="!canAfford"
            >You have <UiIcon name="bone" /> {{ player.bones }}.
          </template>
          {{ purchases.message.value || 'Every breed runs the same.' }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.maker {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.preview {
  /* Stays in view while you scroll the options, so each change shows straight away. */
  position: sticky;
  top: 0;
  z-index: 3;
  box-shadow: 0 10px 20px -16px rgba(42, 21, 48, 0.6);
  height: 180px;
  border-radius: 24px;
  background: radial-gradient(circle at 50% 70%, #fff 0%, #f1e6fb 70%);
  border: 1px solid var(--line);
}
.lock {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--plum);
  color: #fff;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 900;
}
.name {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--muted);
  font-weight: 900;
}
.name input {
  font: 900 18px var(--body);
  color: var(--fg);
  padding: 10px 14px;
  border-radius: 14px;
  border: 2px solid var(--line);
  background: var(--surface);
}
.name input:focus {
  outline: none;
  border-color: var(--pink);
}
h3 {
  margin: 0 0 8px;
  font-size: 18px;
}
.breeds {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 8px;
}
.breed {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px 8px;
  border-radius: 16px;
  border: 2px solid var(--line);
  background: var(--surface);
  cursor: pointer;
}
.breed.on {
  border-color: var(--pink);
}
.face {
  width: 52px;
  height: 52px;
}
.bn {
  font-size: 11px;
  font-weight: 900;
  line-height: 1.15;
  text-align: center;
}
.price {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  font-weight: 900;
  background: var(--plum);
  color: #fff;
  border-radius: 999px;
  padding: 1px 6px;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid var(--surface);
  box-shadow: 0 0 0 2px var(--line);
  cursor: pointer;
}
.dot.on {
  box-shadow: 0 0 0 3px var(--pink);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 2px solid var(--line);
  background: var(--surface);
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
}
.chip.on {
  border-color: var(--pink);
  color: var(--pink);
}
.eye {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
.bar {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 0 4px;
  background: linear-gradient(transparent, var(--bg) 30%);
}
.money {
  display: flex;
  gap: 8px;
}
.money > * {
  flex: 1;
  font-size: 15px;
}
.hint {
  margin: 0;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}
</style>
