<script>
    import { h } from 'vue';
    import RawContent from "@/components/content/RawContent";

    export default {
        name: "RollTable",
        components: { RawContent },
        props: {
            table: {
                type: Object,
                default: undefined,
                required: true
            }
        },
        render() {
            return h(
                'table',
                {
                    class: 'roll-table'
                },
                [
                    h(
                        'thead',
                        null,
                        h(
                            'tr',
                            null,
                            this.table.thead.map(th => h(
                                'th',
                                null,
                                h(
                                    RawContent,
                                    {
                                        tag: 'span',
                                        template: th
                                    }
                                )
                            ))
                        )
                    ),
                    h(
                        'tbody',
                        null,
                        this.table.tbody.map(tr => h(
                            'tr',
                            null,
                            tr.map((td, index) => h(
                                !index ? 'th' : 'td',
                                null,
                                h(
                                    RawContent,
                                    {
                                        tag: 'span',
                                        template: td
                                    }
                                )
                            ))
                        ))
                    )
                ]
            );
        }
    };
</script>

<style lang="scss" scoped>
    .roll-table {
        table-layout: auto;
        width: 100%;

        th {
            white-space: nowrap;
        }

        th,
        td {
            padding: 8px 12px;
        }
    }
</style>
