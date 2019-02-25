import anyTest, { TestInterface, ExecutionContext } from 'ava'
import 'envkey'
import {
  SwitchApi,
  connect,
  LedgerEnv,
  SettlementEngineType,
  ReadyUplinks
} from '..'
import { addXrp, addEth, addBtc, testExchange } from './_helpers'

const test = anyTest as TestInterface<SwitchApi>

// Before & after each test, construct and disconnect the API
test.beforeEach(async t => {
  t.context = await connect(process.env.LEDGER_ENV! as LedgerEnv)
})
test.afterEach(async t => t.context.disconnect())

// Test adding and removing uplinks
const testAddRemove = (
  createUplink: (api: SwitchApi) => Promise<ReadyUplinks>
) => async (t: ExecutionContext<SwitchApi>) => {
  const uplink = await createUplink(t.context)
  t.true(t.context.state.uplinks.includes(uplink))

  await t.context.remove(uplink)
  t.false(t.context.state.uplinks.includes(uplink))
}
test('add then remove btc', testAddRemove(addBtc(1)))
test('add then remove eth without deposit', testAddRemove(addEth(1)))
test('add then remove xrp without deposit', testAddRemove(addXrp(1)))

// Test that uplinks with the same credentials cannot be added
test('cannot add duplicate eth uplink', async t => {
  await addEth(1)(t.context)
  await t.throwsAsync(addEth(1)(t.context))
})
test('cannot add duplicate xrp uplink', async t => {
  await addXrp(1)(t.context)
  await t.throwsAsync(addXrp(1)(t.context))
})
test('cannot add duplicate btc uplink', async t => {
  await addBtc(1)(t.context)
  await t.throwsAsync(addBtc(1)(t.context))
})

// Test credential config input validation
// TODO expand input validation tests
test('add with nonsense xrp secret throws', async t => {
  await t.throwsAsync(
    t.context.add({
      settlerType: SettlementEngineType.XrpPaychan,
      secret: 'this is not an xrp secret'
    })
  )
})
test('add with nonsense eth secret throws', async t => {
  await t.throwsAsync(
    t.context.add({
      settlerType: SettlementEngineType.Machinomy,
      privateKey: 'this is not an eth secret'
    })
  )
})
test('add with nonsense lnd credentials throws', async t => {
  await t.throwsAsync(
    t.context.add({
      settlerType: SettlementEngineType.Lnd,
      hostname: 'nonsense',
      tlsCert: 'nonsense',
      macaroon: 'nonsense',
      grpcPort: 12345
    })
  )
})
