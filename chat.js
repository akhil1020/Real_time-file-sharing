import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { File, MessageCircle, UserCheck, LogIn, Bell } from "lucide-react";
import { io } from "socket.io-client";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

const socket = io("http://localhost:5000");

export default function WebApp() {
  const [chatRequests, setChatRequests] = useState([]);
  const [groupFiles, setGroupFiles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchFiles() {
      const querySnapshot = await getDocs(collection(db, "files"));
      setGroupFiles(querySnapshot.docs.map((doc) => doc.data().name));
    }
    fetchFiles();
    
    socket.on("newFile", async (fileName) => {
      setGroupFiles((prev) => [...prev, fileName]);
      setNotifications((prev) => [...prev, `New file uploaded: ${fileName}`]);
      await addDoc(collection(db, "files"), { name: fileName });
    });

    socket.on("newChatRequest", (user) => {
      setChatRequests((prev) => [...prev, user]);
      setNotifications((prev) => [...prev, `New chat request from ${user}`]);
    });
  }, []);
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setGroupFiles([...groupFiles, file.name]);
      socket.emit("uploadFile", file.name);
      await addDoc(collection(db, "files"), { name: file.name });
    }
  };

  const sendChatRequest = (user) => {
    setChatRequests([...chatRequests, user]);
    socket.emit("sendChatRequest", user);
  };

  const authenticateUser = () => {
    setIsAuthenticated(true);
  };

  return (
    <div className="p-6">
      {!isAuthenticated ? (
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">User Authentication</h2>
          <Button onClick={authenticateUser} className="flex items-center gap-2">
            <LogIn /> Login with Email
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="group" className="w-full max-w-2xl mx-auto">
          <TabsList className="flex justify-between bg-gray-200 p-2 rounded-xl">
            <TabsTrigger value="group" className="flex items-center gap-2"><File /> Group Files</TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2"><MessageCircle /> Chat Requests</TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell /> Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="group" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-bold">Shared Materials</h3>
                <Input type="file" accept=".pdf,.ppt,.pptx" onChange={handleFileUpload} className="mt-2" />
                <ul className="mt-2">
                  {groupFiles.map((file, index) => (
                    <li key={index} className="p-2 bg-gray-100 rounded mt-1">📄 {file}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-bold">Chat Requests</h3>
                <Button onClick={() => sendChatRequest("User123")} className="mt-2 flex items-center gap-2">
                  <UserCheck /> Send Request to User123
                </Button>
                <ul className="mt-2">
                  {chatRequests.map((user, index) => (
                    <li key={index} className="p-2 bg-gray-100 rounded mt-1">💬 Request sent to {user}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-bold">Notifications</h3>
                <ul className="mt-2">
                  {notifications.map((note, index) => (
                    <li key={index} className="p-2 bg-yellow-100 rounded mt-1">🔔 {note}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
