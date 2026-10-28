import { Linking, View } from 'react-native';
import { Stamp } from '../../components/motion';
import { useFeedback } from '../../components/overlays';
import { Screen } from '../../components/Screen';
import { BackRow, Button, Eyebrow, H, LinkText, Pill, Txt } from '../../components/ui';
import { dayMonth, fmtUSD, money } from '../../lib/format';
import { useStore } from '../../state/store';
import { goBack, invoicePill } from '../../state/view';
import { C, R } from '../../theme';

export default function Invoices() {
  const { detail, cur, setCur } = useStore();
  const { toast } = useFeedback();
  if (!detail) return null;
  const { project, invoices } = detail;
  const paid = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amountInr, 0);
  const due = invoices.filter(i => i.status !== 'paid').reduce((a, i) => a + i.amountInr, 0);
  const other = cur === 'INR' ? 'USD' : 'INR';
  const contract = project.contractInr == null ? '—' : cur === 'INR' ? money(project.contractInr, 'INR') : fmtUSD(project.contractInr);

  return (
    <Screen>
      <BackRow label={project.name} onBack={goBack} />
      <H size={30} style={{ marginTop: 8 }}>Billing</H>
      <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
        <Total label="Paid to date" value={money(paid, cur)} />
        <Total label="Outstanding" value={money(due, cur)} />
      </View>
      <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
        <Txt size={12} color={C.mu}>Contract {contract} · amounts in {cur} · </Txt>
        <LinkText size={12} onPress={() => setCur(other)}>{'show ' + other}</LinkText>
      </View>

      <Eyebrow style={{ marginTop: 20 }}>Invoices</Eyebrow>
      <View style={{ marginTop: 8, gap: 8 }}>
        {invoices.length === 0 ? <Txt size={14} color={C.mu}>No invoices yet.</Txt> : null}
        {invoices.map((inv, idx) => {
          const p = invoicePill(inv.status, inv.dueOn);
          const when = inv.status === 'paid' ? 'paid ' + (inv.paidOn ? dayMonth(inv.paidOn) : '') : inv.dueOn ? 'due ' + dayMonth(inv.dueOn) : '';
          return (
            <View key={inv.id} style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: R.md, borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Txt w={500} size={15}>{inv.title}</Txt>
                  <Txt f="mono" size={12} color={C.mu} style={{ marginTop: 2 }}>{inv.ref} · {when}</Txt>
                </View>
                <Txt f="mono" size={15}>{money(inv.amountInr, cur)}</Txt>
              </View>
              <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <Pill label={p.label} bg={p.bg} color={p.color} />
                {inv.status === 'due' ? (
                  <Button size="sm" full={false} onPress={() => inv.paymentUrl
                    ? Linking.openURL(inv.paymentUrl)
                    : toast('Payment link is on its way to your billing email.')}>Pay now</Button>
                ) : null}
                {inv.status === 'paid' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Stamp delay={200 + idx * 120}>
                      <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1.5, borderColor: C.mint, borderRadius: 4 }}>
                        <Txt f="mono" size={11} ls={0.14} color={C.mint}>PAID</Txt>
                      </View>
                    </Stamp>
                    <LinkText onPress={() => inv.receiptUrl ? Linking.openURL(inv.receiptUrl) : toast('Receipt emailed to you on payment.')}>Receipt</LinkText>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const Total = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 16, borderRadius: R.md, backgroundColor: C.sf, borderWidth: 1, borderColor: C.ln }}>
    <Eyebrow size={10}>{label}</Eyebrow>
    <H size={22} ls={-0.02} lh={1.2} style={{ marginTop: 6 }}>{value}</H>
  </View>
);
