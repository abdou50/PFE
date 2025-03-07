import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Base64 encoded CNI logo (Replace with actual Base64 string if needed)
const cniLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  contentContainer: {
    borderTop: "1 solid black",
    paddingTop: 10,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
  },
  value: {
    fontSize: 12,
  },
});

const ReclamationPDF = ({
  firstName,
  department,
  type,
  ministre,
  description,
}: {
  firstName: string;
  department: string;
  type: string;
  ministre: string;
  description: string;
}) => {
  // Get current date
  const currentDate = new Date().toLocaleDateString("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo and Title */}
        <View style={styles.header}>
          <Image style={styles.logo} src={cniLogo} />
          <Text style={styles.title}>Détails de la Réclamation</Text>
        </View>

        {/* Details */}
        <View style={styles.contentContainer}>
          <View style={styles.section}>
            <Text style={styles.label}>Date de soumission:</Text>
            <Text style={styles.value}>{currentDate}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Prénom:</Text>
            <Text style={styles.value}>{firstName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Département:</Text>
            <Text style={styles.value}>{department}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{type}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Ministre:</Text>
            <Text style={styles.value}>{ministre}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{description}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ReclamationPDF;