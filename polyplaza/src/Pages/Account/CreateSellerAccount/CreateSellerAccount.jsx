import { useEffect, useState } from "react";
import { useUser } from "../../UserContext";
import { supabase } from "../../../supabase";
import TextField from "../../../GlobalFeatures/TextField";
import "../LoginAccount/style.css";
import AddressBook from "../../../GlobalFeatures/AddressBook";

function CreateSellerAccount() {
  const { userId } = useUser();

  const [sellerName, setSellerName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validIdURL, setValidIdURL] = useState("");
  const [applicationStatus, setApplicationStatus] = useState(null); // "pending" | "accepted" | "rejected" | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState(null);
  const [addressString, setAddressString] = useState(null);

  const [disableSubmit, setDisableSubmit] = useState(false);

  // Fetch latest application on load
  useEffect(() => {
    async function fetchLatestApplication() {
      const { data, error } = await supabase
        .from("seller_application")
        .select("status")
        .eq("buyer_id", userId)
        .order("application_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch seller application:", error.message);
        return;
      }

      if (data) {
        setApplicationStatus(data.status);
        if (data.status === "Pending") {
          setErrorMessage("Your latest application is pending, please wait for approval.");
          setDisableSubmit(true);
        } else if (data.status === "Rejected") {
          setErrorMessage("Your application was rejected. You may reapply.");
        } else if (data.status === "Approved") {
          setSuccessMessage("Your seller application has been approved!");
          setErrorMessage("");
        } else {
          setErrorMessage("");
        }
      }
    }

    if (userId) {
      fetchLatestApplication();
    }
  }, [userId]);

  // Clear success message if user changes input
  useEffect(() => {
    if (sellerName || validIdURL || address) {
      setSuccessMessage("");
    }
  }, [sellerName, validIdURL, address]);

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!sellerName || !validIdURL || !address) {
      setErrorMessage("Fill out all the fields please.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("seller_application").insert({
      valid_id_url: validIdURL,
      buyer_id: userId,
      seller_name: sellerName,
      address_id: address,
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Failed to create seller application:", error.message);
      setErrorMessage("Submission failed. Try again.");
      return;
    }

    setSuccessMessage("Application submitted successfully! Please wait for approval.");
    setApplicationStatus("pending");
    setErrorMessage("Your latest application is pending, please wait for approval.");
  };

  const isDisabled = applicationStatus === "pending";

  return (
    <div className="relative w-screen min-h-screen overflow-hidden p-20">
      <img
        src="/splash-photo.png"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2 justify-around mt-20 p-8 bg-white/90 rounded-xl shadow-2xl backdrop-blur-md w-fit">
          <img src="/logo.png" alt="logo" className="w-32 h-32" />
          <h1 className="text-4xl shiny-text font-extrabold text-emerald-700">PolyPlaza</h1>
          <p className="text-neutral-600">Become a Seller</p>

          {errorMessage && (
            <div className="border-2 p-2 border-red-400 bg-red-100 rounded-xl">
              <p className="text-red-500 font-extrabold">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="border-2 p-2 border-green-400 bg-green-100 rounded-xl">
              <p className="text-green-700 font-extrabold">{successMessage}</p>
            </div>
          )}

          <div className="flex flex-row gap-10 items-center p-5 border-2 border-emerald-200 rounded-2xl">
            <div className="flex flex-col gap-2 w-auto">
              <p className="text-left text-emerald-500 text-2xl font-bold">
                Enter Your Seller Name:
              </p>
              <TextField
                data={sellerName}
                color="emerald-400"
                header="Seller Name"
                setFunction={setSellerName}
                isRequired
              />
              <TextField
                data={validIdURL}
                color="emerald-400"
                header="URL for your valid ID"
                setFunction={setValidIdURL}
                isRequired
              />
              <p className="text-left text-emerald-500 text-2xl font-bold">
                Enter Your Address:
              </p>
              <span className="text-neutral-600">{addressString}</span>
              <AddressBook
                address={address}
                setFunction={setAddress}
                color="emerald-400"
                header="Address"
                returnAddress={setAddressString}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={disableSubmit}
            className={`${
              isDisabled || isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-200 hover:border-2 hover:border-emerald-500 hover:text-emerald-500"
            } duration-200 text-white font-bold py-2 px-4 rounded-xl`}
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateSellerAccount;
